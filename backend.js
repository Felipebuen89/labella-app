/*
 * La'Bella Agenda — adaptador opcional Supabase.
 * Se config.js não estiver configurado, o aplicativo permanece DEMONSTRATIVO.
 * Nunca colocar service_role no cliente.
 */
(async function setupLiveAgenda() {
  const cfg = window.LABELLA_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  const section = document.getElementById('booking');
  if (!section) return;
  const notice = document.querySelector('#agenda-client .demo-note');
  if (notice) notice.textContent = 'Conectando à agenda do salão…';

  function loadSDK() {
    return new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Não foi possível carregar a conexão segura'));
      document.head.append(script);
    });
  }
  function fail(message) {
    if (notice) notice.textContent = message + ' Não efetue reservas nesta tela.';
    document.getElementById('agenda-slots').replaceChildren();
    document.getElementById('agenda-form').hidden = true;
  }
  try { await loadSDK(); } catch (e) { fail(e.message); return; }
  const db = window.supabase.createClient(
    cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey,
    {auth: {autoRefreshToken: true, persistSession: true, detectSessionInUrl: true}}
  );
  const q = (s) => document.getElementById(s);
  const agendaSelect = q('agenda-service'), agendaDay = q('agenda-date');
  let dbServices = [], chosen = null, loading = false, professionalId = null;

  async function loadServices() {
    const {data, error} = await db.from('lb_services')
      .select('id,name,duration_minutes,buffer_minutes').eq('active',true).order('name');
    if (error) throw error;
    if (!data || !data.length) throw new Error('Nenhum procedimento foi cadastrado');
    dbServices = data;
    agendaSelect.replaceChildren();
    for (const item of data) {
      const option = document.createElement('option');
      option.value = item.id; option.textContent = item.name;
      agendaSelect.append(option);
    }
    if (notice) notice.textContent = 'Agenda conectada. Os horários livres e ocupados são verificados no banco de dados em tempo real.';
    q('agenda-form').querySelector('button[type=submit]').textContent = 'Confirmar reserva';
    const consent = document.createElement('p');
    consent.className = 'details';
    consent.textContent = 'Nome e telefone serão enviados ao salão para identificação e gestão da reserva. Confirme os dados antes de agendar.';
    q('agenda-form').append(consent);
  }

  async function liveSlots() {
    if (loading || !dbServices.length) return;
    loading = true; chosen = null;
    q('agenda-form').hidden = true;
    q('agenda-feedback').textContent = '';
    const grid = q('agenda-slots');
    grid.textContent = 'Consultando horários…';
    const service = dbServices.find(s => s.id === agendaSelect.value);
    q('agenda-duration').textContent = service
      ? 'Duração total: ' + (service.duration_minutes+service.buffer_minutes) + ' minutos'
      : '';
    const {data,error} = await db.rpc('lb_slots', {
      p_service_id: agendaSelect.value,
      p_day: agendaDay.value,
      p_professional_id: professionalId
    });
    loading = false; grid.replaceChildren();
    if (error) {
      fail('Não foi possível consultar horários: ' + error.message);
      return;
    }
    if (!data || !data.length) {
      const empty = document.createElement('p');
      empty.className = 'details';
      empty.textContent = 'Não há expediente cadastrado para este dia ou a data está fora da janela de agendamento.';
      grid.append(empty); return;
    }
    for (const slot of data) {
      const free = slot.state === 'livre';
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'agenda-slot';
      button.disabled = !free;
      button.setAttribute('aria-label',slot.slot_start+' '+(free?'livre':'indisponível'));
      const line = document.createElement('span'); line.textContent = slot.slot_start;
      const detail = document.createElement('small');
      detail.textContent = free ? 'Livre' : slot.state === 'ocupado' ? 'Ocupado' : 'Indisponível';
      button.append(line,detail);
      button.onclick = () => {
        grid.querySelectorAll('button').forEach(b => b.classList.remove('chosen'));
        button.classList.add('chosen');
        chosen = slot;
        q('agenda-summary').textContent =
          service.name + ' — ' + agendaDay.value.split('-').reverse().join('/') +
          ' — ' + slot.slot_start + ' às ' + slot.slot_end;
        q('agenda-form').hidden = false;
      };
      grid.append(button);
    }
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!chosen || loading) return;
    const name = q('agenda-name').value.trim();
    const phone = q('agenda-phone').value.trim();
    if (name.length < 2 || phone.replace(/\D/g,'').length < 10) {
      q('agenda-feedback').textContent = 'Confira nome e telefone.';
      return;
    }
    const confirm = q('agenda-form').querySelector('button[type=submit]');
    confirm.disabled = true;
    q('agenda-feedback').textContent = 'Confirmando disponibilidade…';
    const {data,error} = await db.rpc('lb_reserve',{
      p_service_id:agendaSelect.value,
      p_day:agendaDay.value,
      p_start:chosen.slot_start,
      p_name:name,
      p_phone:phone,
      p_professional_id:professionalId
    });
    confirm.disabled = false;
    if (error) {
      q('agenda-feedback').textContent =
        'Não foi possível reservar: '+error.message+'. Escolha outro horário.';
      await liveSlots();
      return;
    }
    await liveSlots();
    q('agenda-feedback').textContent = 'Reserva confirmada! Código: '+data+
      '. O horário foi bloqueado na agenda do salão.';
  }

  try { await loadServices(); } catch (e) { fail('A agenda não está pronta: '+e.message); return; }
  agendaSelect.onchange = liveSlots;
  agendaDay.onchange = liveSlots;
  q('agenda-form').onsubmit = submitBooking;
  const oldCardButtons = [...document.querySelectorAll('#services-container .card-link')];
  oldCardButtons.forEach((button,i)=>{button.onclick=()=>{
    go('booking');
    const match = dbServices.find(x=>x.name===services[i].name);
    if (match) agendaSelect.value=match.id;
    liveSlots();
  }});
  // O perfil proprietário usa outra página e sessões independentes.
  // Nenhum formulário de gestão é renderizado na interface pública.
  await liveSlots();
})();