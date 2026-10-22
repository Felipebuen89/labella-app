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
  // O painel de gestão deixa de exibir campos públicos de demonstração quando a conexão está ativa.
  q('agenda-admin').replaceChildren();
  const title = document.createElement('h1'); title.className='section-title'; title.textContent='Área da proprietária';
  const adminState = document.createElement('div');adminState.className='details';
  const loginForm = document.createElement('form');
  const emailLabel = document.createElement('label');emailLabel.className='label';emailLabel.textContent='E-mail autorizado';
  const email = document.createElement('input');email.type='email';email.required=true;email.placeholder='seu@email.com'; emailLabel.append(email);
  const login = document.createElement('button');login.className='action';login.type='submit';login.textContent='Receber link de acesso';
  loginForm.append(emailLabel,login);
  const manage = document.createElement('div');
  q('agenda-admin').append(title,adminState,loginForm,manage);

  loginForm.onsubmit = async e => {
    e.preventDefault();
    const {error} = await db.auth.signInWithOtp({
      email: email.value.trim(),
      options: {shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}
    });
    adminState.textContent = error
      ? 'Não foi possível enviar o acesso: '+error.message
      : 'Se o e-mail tiver autorização, enviaremos o link de acesso.';
  };

  async function ownerArea() {
    const {data:{session}} = await db.auth.getSession();
    if (!session) {loginForm.hidden=false;manage.replaceChildren();adminState.textContent='Acesse com o e-mail autorizado do salão.';return;}
    const {data:staff,error} = await db.from('lb_staff').select('user_id').eq('user_id',session.user.id).limit(1);
    if(error || !staff?.length){
      loginForm.hidden=true;adminState.textContent='Este usuário não tem autorização de gestão.';manage.replaceChildren();return;
    }
    loginForm.hidden=true;adminState.textContent='Acesso autorizado. Suas alterações serão salvas na agenda real.';
    manage.replaceChildren();
    const {data:adminServices,error:serviceError} = await db.from('lb_services')
      .select('id,name,duration_minutes,buffer_minutes,active').order('name');
    if(serviceError){adminState.textContent='Erro ao ler procedimentos: '+serviceError.message;return}
    const hdr=document.createElement('h2');hdr.className='section-title';hdr.style.fontSize='24px';hdr.textContent='Duração dos procedimentos';manage.append(hdr);
    for(const service of adminServices){
      const row=document.createElement('label');row.className='agenda-setting';
      const name=document.createElement('span');name.textContent=service.name;
      const picker=document.createElement('select');
      [15,30,45,60,75,90,120,150,180,210,240,300,360,420,480].forEach(n=>{
        const op=document.createElement('option');op.value=n;op.textContent=n+' min';picker.append(op)});
      picker.value=String(service.duration_minutes);
      picker.onchange=async ()=>{
        picker.disabled=true;
        const {error}=await db.from('lb_services').update({duration_minutes:Number(picker.value)}).eq('id',service.id);
        picker.disabled=false;adminState.textContent=error?'Erro: '+error.message:'Duração atualizada.';
        if(!error)await loadServices();
      };
      row.append(name,picker);manage.append(row);
    }

    const appointmentsTitle=document.createElement('h2');appointmentsTitle.className='section-title';
    appointmentsTitle.style.fontSize='24px';appointmentsTitle.textContent='Reservas e bloqueios';
    const dateLabel=document.createElement('label');dateLabel.className='label';dateLabel.textContent='Data de consulta';
    const dateInput=document.createElement('input');dateInput.type='date';dateInput.value=agendaDay.value;dateLabel.append(dateInput);
    const bookings=document.createElement('div');
    const refresh=document.createElement('button');refresh.textContent='Atualizar reservas';refresh.className='overlay-link';
    const blocks=document.createElement('form');blocks.innerHTML=
      '<h3>Bloquear horário</h3><label class="label">Início<input type="time" required value="12:00"></label>'+
      '<label class="label">Término<input type="time" required value="13:00"></label>'+
      '<button type="submit" class="overlay-link">Bloquear na agenda</button>';
    manage.append(appointmentsTitle,dateLabel,refresh,bookings,blocks);
    async function loadBookings(){
      bookings.replaceChildren();const iso=dateInput.value;
      const {data,error}=await db.from('lb_bookings')
        .select('id,status,starts_at,ends_at,customer_name,customer_phone')
        .gte('starts_at',iso+'T00:00:00-03:00')
        .lt('starts_at',iso+'T23:59:59-03:00')
        .in('status',['confirmed','blocked']).order('starts_at');
      if(error){bookings.textContent='Erro: '+error.message;return;}
      if(!data?.length){bookings.textContent='Sem reservas ou bloqueios neste dia.';return;}
      for(const b of data){
        const row=document.createElement('div');row.className='agenda-existing-row';
        const time=t=>new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(t));
        const label=document.createElement('span');label.textContent=time(b.starts_at)+'–'+time(b.ends_at)+
          ' · '+(b.status==='blocked'?'Bloqueado':(b.customer_name||'Cliente'));
        const cancel=document.createElement('button');cancel.className='overlay-link';cancel.style.width='auto';cancel.textContent='Cancelar';
        cancel.onclick=async()=>{
          if(!window.confirm('Cancelar este horário?'))return;
          const {error}=await db.from('lb_bookings').update({status:'cancelled'}).eq('id',b.id);
          adminState.textContent=error?'Erro: '+error.message:'Horário liberado.';
          if(!error){await loadBookings();await liveSlots();}
        };
        row.append(label,cancel);bookings.append(row);
      }
    }
    refresh.onclick=loadBookings;dateInput.onchange=loadBookings;
    blocks.onsubmit=async e=>{
      e.preventDefault();
      const times=blocks.querySelectorAll('input[type=time]');
      const a=times[0].value,b=times[1].value;
      if(a>=b){adminState.textContent='O término deve ser depois do início.';return}
      const {data:pros,error:pe}=await db.from('lb_professionals').select('id').eq('active',true).order('name').limit(1);
      if(pe||!pros?.length){adminState.textContent='Nenhuma profissional cadastrada.';return;}
      const iso=t=>new Date(dateInput.value+'T'+t+':00-03:00').toISOString();
      const {error}=await db.from('lb_bookings').insert({
        professional_id:pros[0].id,starts_at:iso(a),ends_at:iso(b),status:'blocked'
      });
      adminState.textContent=error?'Erro: '+error.message:'Intervalo bloqueado.';
      if(!error){await loadBookings();await liveSlots();}
    };
    await loadBookings();
    const logout=document.createElement('button');logout.className='overlay-link';logout.textContent='Sair da gestão';
    logout.onclick=async()=>{await db.auth.signOut();await ownerArea()};
    manage.append(logout);
  }
  q('agenda-tab-admin').onclick = async()=> {
    showAgenda('admin');
    await ownerArea();
  };
  db.auth.onAuthStateChange((_event,session)=>{if(!q('agenda-admin').hidden)ownerArea()});
  await liveSlots();
})();