/* Dados inteiramente fictícios: demonstração local, sem cadastro de clientes reais. */
export const TENANTS = {
  aurora: {
    id: "aurora", name: "Aurora Cosméticos", short: "AC", category: "Beleza & cosméticos",
    headline: "Seu negócio merece uma operação à altura.",
    products: [
      {id:"a1", name:"Sérum Facial Premium", category:"Skincare", cost:39.90, suggested:89.90, emoji:"✨"},
      {id:"a2", name:"Hidratante Diário", category:"Skincare", cost:28.50, suggested:69.90, emoji:"🧴"},
      {id:"a3", name:"Body Splash Floral", category:"Perfumaria", cost:32, suggested:79, emoji:"🌷"},
      {id:"a4", name:"Kit Rotina de Beleza", category:"Kits", cost:88, suggested:189, emoji:"🎁"},
      {id:"a5", name:"Máscara Capilar", category:"Cabelos", cost:35.50, suggested:84.90, emoji:"💫"},
      {id:"a6", name:"Óleo Reparador", category:"Cabelos", cost:21.90, suggested:59.90, emoji:"🌿"}
    ],
    campaign: {title:"Semana da Rede", body:"Oportunidades especiais para impulsionar suas vendas.", coupon:"REDE10", percent:10}
  },
  viva: {
    id:"viva", name:"Viva Pet", short:"VP", category:"Pet shop & cuidados",
    headline:"Tudo que sua rede precisa para crescer.",
    products:[
      {id:"v1", name:"Shampoo Pet Suave", category:"Higiene", cost:18.50, suggested:43.90, emoji:"🫧"},
      {id:"v2", name:"Condicionador Pet", category:"Higiene", cost:22.00, suggested:54.90, emoji:"🐾"},
      {id:"v3", name:"Brinquedo Interativo", category:"Acessórios", cost:25.90, suggested:65.00, emoji:"🎾"},
      {id:"v4", name:"Coleira Ajustável", category:"Acessórios", cost:14.90, suggested:42.90, emoji:"🦴"},
      {id:"v5", name:"Petisco Natural", category:"Alimentação", cost:12.00, suggested:29.90, emoji:"🍪"},
      {id:"v6", name:"Kit Banho Premium", category:"Kits", cost:51.00, suggested:119.00, emoji:"🎁"}
    ],
    campaign:{title:"Campanha de Boas-vindas", body:"Monte seu pedido e aproveite as condições da rede.", coupon:"BEMVINDO", percent:8}
  }
};
export const BRAND_DEFAULTS = {
  subtitle: "Gestão inteligente de franquias", gold:"#C8A76E", logoUrl:"",
  resellerLabel:"Consultor de vendas", resellerName:"Alex Demo",
  city:"Campinas, SP"
};
export const STORE_PREFIX = "redeos-demo-v1:";
export function loadTenantState(id) {
  const sample = TENANTS[id];
  const initial = {
    brand: {...BRAND_DEFAULTS, displayName:sample.name},
    stock:{}, cart:{}, orders:[], sales:[], notifications:[],
    campaigns:[{id:"c-default",...sample.campaign,active:true}],
    training:[{id:"tr-1",title:"Como apresentar valor ao cliente",description:"Comece pelos benefícios do produto, depois explique as condições da oferta."},
      {id:"tr-2",title:"Pós-venda que fideliza",description:"Confirme a satisfação do cliente e acompanhe oportunidades de reposição."}],
    sellers:[{id:"seller-demo",name:"Alex Demo",city:"Campinas, SP",phone:"(00) 00000-0000",status:"Ativo"}]
  };
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_PREFIX+id) || "null");
    if (!stored || !stored.brand) return initial;
    return {...initial,...stored,brand:{...initial.brand,...stored.brand}};
  } catch (_) { return initial; }
}
export function saveTenantState(id, state) {
  localStorage.setItem(STORE_PREFIX+id, JSON.stringify(state));
}
