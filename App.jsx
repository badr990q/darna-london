import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Building2, Hotel, Plane, BriefcaseBusiness, Menu, X,
  Search, Phone, MessageCircle, ShieldCheck, ClipboardList, Users,
  LayoutDashboard, CheckCircle2, Clock3, MapPin, Mail, ChevronDown
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const services = [
  { id: "property", title: "العقارات والسكن", en: "Property & Housing", desc: "مساعدة في البحث عن عقار، طلبات الإيجار، وإدارة الاستفسارات العقارية.", icon: Building2 },
  { id: "hotel", title: "الفنادق والإقامة", en: "Hotels & Stays", desc: "استفسر عن الفنادق وخيارات الإقامة، وأرسل طلب الحجز ليتابعه فريقنا.", icon: Hotel },
  { id: "visa", title: "طلبات التأشيرات", en: "Visa Assistance", desc: "ابدأ طلب المساعدة في التأشيرة وتابع المستندات والخطوات مع فريقنا.", icon: Plane },
  { id: "business", title: "خدمات الأعمال والمكتب", en: "Business & Office Support", desc: "مساعدة إدارية، تعبئة نماذج، مراسلات، وترجمة وتنسيق مستندات.", icon: BriefcaseBusiness },
];

const initialListings = [
  { title: "شقة عائلية في غرب لندن", type: "إيجار", location: "غرب لندن", price: "يُحدد عند الاستفسار", tag: "عقارات" },
  { title: "إقامة فندقية في وسط لندن", type: "فندق", location: "وسط لندن", price: "حسب التواريخ", tag: "فنادق" },
  { title: "استشارة خدمات أعمال", type: "خدمة", location: "عن بُعد / لندن", price: "حسب الخدمة", tag: "أعمال" },
];

function Header({ onAdmin }) {
  const [open, setOpen] = useState(false);
  return <header className="header"><div className="container nav">
    <a className="brand" href="#"><span className="brand-mark">D</span><span>DARNA<small>LONDON</small></span></a>
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="القائمة">{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "nav-links show" : "nav-links"}>
      <a href="#services" onClick={() => setOpen(false)}>الخدمات</a><a href="#listings" onClick={() => setOpen(false)}>العقارات والإقامة</a><a href="#how" onClick={() => setOpen(false)}>كيف نعمل</a><a href="#contact" onClick={() => setOpen(false)}>اتصل بنا</a>
    </nav>
    <button className="btn btn-dark nav-cta" onClick={onAdmin}>دخول الإدارة <ArrowLeft size={16}/></button>
  </div></header>;
}

function RequestModal({ service, onClose }) {
  const [form, setForm] = useState({ full_name:"", email:"", phone:"", request_type:service?.id || "general", details:"", preferred_date:"" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setStatus("");
    const payload = { ...form, status: "new", source: "website" };
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from("service_requests").insert(payload);
        if (error) throw error;
        setStatus("success");
      } else {
        const old = JSON.parse(localStorage.getItem("darna_demo_requests") || "[]");
        localStorage.setItem("darna_demo_requests", JSON.stringify([{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...old]));
        setStatus("demo");
      }
    } catch (err) { setStatus("error"); }
    finally { setBusy(false); }
  }

  if (!service) return null;
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}><X/></button>
    <span className="eyebrow">DARNA REQUEST</span><h2>اطلب خدمة: {service.title}</h2><p className="muted">أرسل التفاصيل وسيقوم فريق دارنا بمراجعة طلبك والتواصل معك لتأكيد الخطوات.</p>
    {status === "success" || status === "demo" ? <div className="success"><CheckCircle2/><h3>تم تسجيل طلبك</h3><p>{status === "demo" ? "تم حفظ الطلب محلياً كعرض تجريبي. اربط Supabase لتفعيل استقبال الطلبات مركزياً." : "وصل طلبك إلى النظام. سيتواصل معك فريقنا."}</p><button className="btn btn-dark" onClick={onClose}>إغلاق</button></div> :
    <form className="form" onSubmit={submit}>
      <div className="form-grid"><label>الاسم الكامل<input required name="full_name" value={form.full_name} onChange={update} /></label><label>رقم الهاتف<input required name="phone" value={form.phone} onChange={update} /></label><label>البريد الإلكتروني<input type="email" name="email" value={form.email} onChange={update}/></label><label>التاريخ المطلوب<input type="date" name="preferred_date" value={form.preferred_date} onChange={update}/></label></div>
      <label>تفاصيل الطلب<textarea required rows="4" name="details" value={form.details} onChange={update} placeholder="اكتب ما تحتاجه وأي تفاصيل مهمة..."/></label>
      {status === "error" && <p className="error">تعذر إرسال الطلب. تحقق من إعدادات قاعدة البيانات وحاول مجدداً.</p>}
      <button className="btn btn-primary full" disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال الطلب"} <ArrowLeft size={17}/></button>
      <small className="muted">إرسال الطلب لا يعني تأكيد حجز أو إصدار تأشيرة. يتم التأكيد بعد مراجعة الفريق.</small>
    </form>}
  </div></div>;
}

function AdminPanel({ onClose }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  async function login(e) {
    e.preventDefault(); setMessage("");
    if (!isSupabaseConfigured) { setMessage("اربط Supabase أولاً لتفعيل تسجيل دخول الإدارة."); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage("بيانات الدخول غير صحيحة أو الحساب غير مفعل."); return; }
    const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", data.user.id).single();
    if (!profile || !["admin", "staff"].includes(profile.role)) {
      await supabase.auth.signOut(); setMessage("هذا الحساب لا يملك صلاحية الإدارة أو الموظفين."); return;
    }
    setUser({ ...data.user, ...profile }); setTab("dashboard"); loadRequests();
  }
  async function loadRequests() {
    const { data, error } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(100);
    if (!error) setRequests(data || []);
  }
  async function changeStatus(id, status) {
    const { error } = await supabase.from("service_requests").update({ status }).eq("id", id);
    if (!error) loadRequests();
  }
  async function logout() { await supabase.auth.signOut(); setUser(null); setTab("login"); }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal admin-modal" onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}><X/></button>
    {!user ? <><span className="eyebrow">SECURE STAFF AREA</span><h2>دخول الإدارة</h2><p className="muted">للمدير والموظفين المعتمدين فقط.</p>
      <form className="form" onSubmit={login}><label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{message && <p className="error">{message}</p>}<button className="btn btn-dark full">تسجيل الدخول</button></form>
      <p className="tiny muted">لا يوجد حساب افتراضي مدمج. أنشئ المستخدم من Supabase ثم امنحه دور admin أو staff من جدول profiles.</p>
    </> : <><div className="admin-head"><div><span className="eyebrow">DARNA CONTROL</span><h2>مرحباً، {user.full_name || user.email}</h2><span className="pill">{user.role === "admin" ? "مدير" : "موظف"}</span></div><button className="btn btn-outline" onClick={logout}>خروج</button></div>
      <div className="admin-toolbar"><button className="btn btn-outline" onClick={loadRequests}><ClipboardList size={16}/> تحديث الطلبات</button><span className="muted tiny">آخر 100 طلب</span></div>
      <div className="request-list">{requests.map(r=><div className="request-row" key={r.id}><div><b>{r.full_name}</b><p>{r.phone} · {r.request_type}</p><small>{r.details}</small></div><select value={r.status} onChange={e=>changeStatus(r.id,e.target.value)}><option value="new">جديد</option><option value="in_progress">قيد المتابعة</option><option value="waiting_customer">بانتظار العميل</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select></div>)}{!requests.length && <p className="muted">لا توجد طلبات حالياً.</p>}</div>
    </>}
  </div></div>;
}

function App() {
  const [selectedService, setSelectedService] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [filter, setFilter] = useState("الكل");
  const [query, setQuery] = useState("");
  const listings = useMemo(() => initialListings.filter(x => (filter==="الكل" || x.tag===filter) && (x.title+x.location).includes(query)), [filter, query]);
  const wa = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  const waLink = wa ? `https://wa.me/${wa}` : "#contact";

  return <>
    <Header onAdmin={() => setAdminOpen(true)}/>
    <main>
      <section className="hero"><div className="container hero-grid"><div className="hero-copy">
        <span className="eyebrow light">YOUR TRUSTED PARTNER IN LONDON</span>
        <h1>كل ما تحتاجه،<br/><em>في مكان واحد.</em></h1>
        <p>من العقارات والإقامة إلى التأشيرات وخدمات الأعمال. فريق دارنا يرافقك من أول استفسار حتى اكتمال طلبك.</p>
        <div className="hero-actions"><a className="btn btn-light" href="#services">اكتشف خدماتنا <ArrowLeft size={17}/></a><a className="btn btn-ghost" href={waLink} target={wa ? "_blank" : undefined} rel="noreferrer"><MessageCircle size={17}/> تواصل معنا</a></div>
        <div className="hero-note"><ShieldCheck size={17}/> متابعة بشرية واضحة لكل طلب</div>
      </div><div className="hero-art"><div className="art-card art-main"><div className="art-label">DARNA · LONDON</div><div className="art-circle"><Building2 size={60}/></div><div className="art-caption"><b>خدمات متكاملة</b><span>عقارات · إقامة · أعمال</span></div></div><div className="floating-card"><CheckCircle2/><span><b>طلبك تحت المتابعة</b><small>من فريق دارنا</small></span></div></div></div></section>

      <section className="trust-strip"><div className="container trust-grid"><div><Users/><b>خدمة تتمحور حول العميل</b></div><div><ClipboardList/><b>متابعة منظمة للطلبات</b></div><div><MessageCircle/><b>تواصل مباشر مع الفريق</b></div></div></section>

      <section className="section container" id="services"><div className="section-heading"><div><span className="eyebrow">WHAT WE DO</span><h2>خدمات دارنا</h2><p>اختر الخدمة المناسبة وأرسل طلبك إلكترونياً.</p></div><span className="section-index">01 / SERVICES</span></div>
        <div className="service-grid">{services.map((s,i)=>{const Icon=s.icon;return <article className="service-card" key={s.id}><div className="service-top"><span className="service-icon"><Icon/></span><span className="card-number">0{i+1}</span></div><h3>{s.title}</h3><span className="english">{s.en}</span><p>{s.desc}</p><button className="text-link" onClick={()=>setSelectedService(s)}>اطلب هذه الخدمة <ArrowLeft size={16}/></button></article>})}</div>
      </section>

      <section className="section listings-section" id="listings"><div className="container"><div className="section-heading"><div><span className="eyebrow">EXPLORE DARNA</span><h2>العقارات والإقامة والخدمات</h2><p>استكشف الخيارات أو أرسل استفساراً لفريقنا.</p></div><span className="section-index">02 / DISCOVER</span></div>
        <div className="listing-tools"><div className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن خدمة أو موقع"/></div><div className="filters">{["الكل","عقارات","فنادق","أعمال"].map(f=><button className={filter===f?"active":""} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div></div>
        <div className="listing-grid">{listings.map((l,i)=><article className="listing-card" key={l.title}><div className={`listing-visual visual-${i%3}`}><span>{l.tag}</span><Building2 size={42}/></div><div className="listing-content"><span className="muted tiny"><MapPin size={13}/> {l.location}</span><h3>{l.title}</h3><div className="listing-bottom"><b>{l.price}</b><button className="icon-button" onClick={()=>setSelectedService(services.find(s=>s.id===(l.tag==="فنادق"?"hotel":l.tag==="أعمال"?"business":"property")))}><ArrowLeft/></button></div></div></article>)}</div>
      </div></section>

      <section className="process-section" id="how"><div className="container"><div className="section-heading light-heading"><div><span className="eyebrow light">SIMPLE PROCESS</span><h2>كيف نعمل؟</h2><p>خطوات واضحة من الاستفسار إلى إتمام الخدمة.</p></div><span className="section-index">03 / PROCESS</span></div><div className="process-grid"><div><span>01</span><h3>أرسل طلبك</h3><p>اختر الخدمة وشاركنا التفاصيل الأساسية.</p></div><div><span>02</span><h3>مراجعة الفريق</h3><p>يراجع الموظف الطلب ويتواصل معك للتوضيح.</p></div><div><span>03</span><h3>تأكيد ومتابعة</h3><p>نوضح الخطوات والتكلفة ثم نتابع حالة الطلب.</p></div><div><span>04</span><h3>إتمام الخدمة</h3><p>نحدث حالة الطلب ونبقيك على اطلاع.</p></div></div></div></section>

      <section className="contact-section container" id="contact"><div><span className="eyebrow">LET'S TALK</span><h2>لديك استفسار؟<br/>نحن هنا للمساعدة.</h2><p>أرسل طلبك عبر الموقع أو تواصل مع فريق دارنا مباشرة.</p></div><div className="contact-card"><div><Phone/><span><b>اتصل بنا</b><small>أضف رقم الهاتف الرسمي في إعدادات المشروع</small></span></div><div><Mail/><span><b>البريد الإلكتروني</b><small>أضف بريد دارنا الرسمي</small></span></div><a className="btn btn-dark full" href={waLink} target={wa ? "_blank" : undefined} rel="noreferrer"><MessageCircle/> تواصل عبر واتساب</a></div></section>
    </main>
    <footer><div className="container footer-inner"><a className="brand brand-footer" href="#"><span className="brand-mark">D</span><span>DARNA<small>LONDON</small></span></a><span>© {new Date().getFullYear()} DARNA London. جميع الحقوق محفوظة.</span><a href="#" onClick={e=>{e.preventDefault();setAdminOpen(true)}}>دخول الإدارة</a></div></footer>
    {selectedService && <RequestModal service={selectedService} onClose={()=>setSelectedService(null)}/>}
    {adminOpen && <AdminPanel onClose={()=>setAdminOpen(false)}/>}
  </>;
}

export default App;
