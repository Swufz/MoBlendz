import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarCheck, CalendarDays, ChevronDown, Clock, DollarSign, Heart, RotateCw, Scissors, Settings, Star, UserRound, UsersRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/luxury-ui";
import { formatBookingDate, formatBookingTime } from "@/lib/business-logic";
import { formatServiceLabel, hasScalpNeckMassageAddon } from "@/lib/config";
import { getSessionProfile, getSupabaseOrNull } from "@/lib/data";
import { buildAdminDashboard, collectedAmount, type DashboardBooking, type DashboardCustomer, type DashboardPeriod } from "@/lib/admin-dashboard";
import { BUSINESS_TIME_ZONE, createBookingDateTime } from "@/lib/timezone";

type Metric = "revenue" | "bookings" | "customers";
const periods = {today:"Today", week:"Last 7 days", month:"Last 30 days"};
const money = (value: number) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:2}).format(value);

export default async function AdminPage({searchParams}: {searchParams: Promise<{period?:string;metric?:string}>}) {
  const { profile } = await getSessionProfile();
  if (profile?.role !== "admin") redirect("/");
  const supabase = await getSupabaseOrNull();
  if (!supabase) redirect("/");
  const params = await searchParams;
  const period: DashboardPeriod = params.period === "week" || params.period === "month" ? params.period : "today";
  const metric: Metric = params.metric === "bookings" || params.metric === "customers" ? params.metric : "revenue";
  // ponytail: paginate compact history for accurate totals; move aggregation into SQL if history outgrows admin page latency.
  async function readRows<T>(table: "bookings" | "profiles", columns: string) {
    const rows: T[] = [];
    while (true) {
      let query = supabase!.from(table).select(columns, {count:"exact"}).order("id").range(rows.length, rows.length + 999);
      if (table === "profiles") query = query.eq("role", "customer");
      const {data,error,count} = await query.returns<T[]>();
      if (error) return {rows:[] as T[],error:error.message};
      rows.push(...(data ?? []));
      if (!data?.length || rows.length >= (count ?? rows.length)) return {rows,error:null};
    }
  }
  const [bookingResult,customerResult] = await Promise.all([
    readRows<DashboardBooking>("bookings", "id,user_id,service_type,date_time,status,duration_minutes,notes,base_price,final_price,discount_amount,completed_at"),
    readRows<DashboardCustomer>("profiles", "id,full_name,phone,created_at"),
  ]);
  const error = bookingResult.error ?? customerResult.error;
  const data = buildAdminDashboard(bookingResult.rows, customerResult.rows, period);
  const customers = new Map(customerResult.rows.map(customer => [customer.id,customer]));
  const value = (stat: string | number | null) => error ? "—" : stat ?? "—";
  const comparison = period === "today" ? "yesterday" : `previous ${data.days} days`;
  const dateLabel = new Intl.DateTimeFormat("en-US", {timeZone:BUSINESS_TIME_ZONE,weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(createBookingDateTime(data.today,"12:00"));

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="admin-dashboard">
        <section className="admin-overview" aria-labelledby="admin-title">
          <div className="admin-overview-copy">
            <p className="account-label">Admin dashboard</p>
            <h1 id="admin-title">{period === "today" ? "Today at a glance" : "Your business at a glance"}</h1>
            <p>Here&apos;s what&apos;s happening with your business.</p>
          </div>
          <div className="admin-period">
            <details><summary><CalendarDays size={20} /><span>{periods[period]}</span><ChevronDown size={16} /></summary>
              <nav aria-label="Dashboard reporting period">{Object.entries(periods).map(([key,label]) => <Link key={key} href={`/admin?period=${key}&metric=${metric}`} aria-current={period === key ? "true" : undefined}>{label}</Link>)}</nav>
            </details>
            <p>{dateLabel}</p>
          </div>
          <div className="admin-hero-portrait" aria-hidden="true"><Image src="/images/landing-hero.png" alt="" fill preload sizes="(min-width: 1024px) 250px, 150px" className="object-contain object-bottom" /></div>
        </section>
        {error ? <p role="alert" className="admin-data-error">Dashboard data could not load: {error}. Refresh to try again.</p> : null}
        <section className="admin-metrics" aria-label={`${periods[period]} statistics`}>
          <Stat icon={<CalendarCheck />} label="Total bookings" value={value(data.selected.length)}><Change current={data.selected.length} previous={data.previousBookings} comparison={comparison} unavailable={!!error} /></Stat>
          <Stat icon={<DollarSign />} label="Collected revenue" value={value(money(data.revenue))}><Change current={data.revenue} previous={data.previousRevenue} comparison={comparison} unavailable={!!error} /></Stat>
          <Stat icon={<Scissors />} label="Completed haircuts" value={value(data.completed)}><span>Completed visits in this period</span></Stat>
          <Stat icon={<UserRound />} label="New customers" value={value(data.newCustomers)}><Change current={data.newCustomers} previous={data.previousNewCustomers} comparison={comparison} unavailable={!!error} /></Stat>
          <Stat icon={<Star />} label="Returning customers" value={value(data.returning)}><div className="admin-mini-progress"><span>{error ? "—" : `${data.returningPercent}%`}</span><progress value={data.returningPercent} max="100" aria-label="Returning share of customers served" /></div></Stat>
          <Stat icon={<Clock />} label="Avg. booked duration" value={value(data.averageDuration === null ? null : `${data.averageDuration} min`)}><span>For completed appointments</span></Stat>
        </section>
        <div className="admin-chart-grid">
          <section className="admin-panel admin-revenue" aria-labelledby="revenue-title">
            <div className="admin-panel-heading"><div><h2 id="revenue-title">{metric === "revenue" ? "Revenue" : metric === "bookings" ? "Bookings" : "Customers"}</h2><p>{metric === "revenue" ? "Daily collected revenue" : metric === "bookings" ? "Scheduled appointments" : "New customer registrations"} · last 14 days</p></div>
              <nav className="admin-chart-tabs" aria-label="Chart metric">{(["revenue","bookings","customers"] as const).map(item => <Link key={item} href={`/admin?period=${period}&metric=${item}`} aria-current={metric === item ? "page" : undefined}>{item[0].toUpperCase() + item.slice(1)}</Link>)}</nav>
            </div>
            {error ? <p className="admin-empty">Chart unavailable.</p> : <RevenueChart daily={data.daily} metric={metric} />}
          </section>
          <section className="admin-panel" aria-labelledby="service-title">
            <div className="admin-panel-heading"><div><h2 id="service-title">Bookings by service</h2><p>Distribution · {periods[period].toLowerCase()}</p></div></div>
            <div className="admin-service-breakdown">
              <div className="admin-donut" role="img" aria-label={`${data.selected.length} bookings: ${data.serviceCounts.map(item => `${formatServiceLabel(item.service)}, ${item.count}`).join('; ')}`} style={{background:error || !data.selected.length ? "#263a2c" : `conic-gradient(#cbb277 0 ${data.serviceCounts[0].count / data.selected.length * 100}%, #527c60 0 100%)`}}><div><strong>{value(data.selected.length)}</strong><span>Bookings</span></div></div>
              <div className="admin-service-legend">{data.serviceCounts.map((item,index) => <div key={item.service}><i style={{background:index ? "#527c60" : "#cbb277"}} /><span>{formatServiceLabel(item.service)}<small>{value(item.count)} {error ? "" : `(${data.selected.length ? Math.round(item.count / data.selected.length * 100) : 0}%)`}</small></span></div>)}</div>
            </div>
            <p className="admin-caption">{value(data.addOns)} massage add-ons, included in haircut bookings.</p>
          </section>
          <section className="admin-panel" aria-labelledby="upcoming-title">
            <div className="admin-panel-heading"><h2 id="upcoming-title">Upcoming bookings</h2><Link href="/admin/bookings?status=upcoming">View all <ArrowRight size={13} /></Link></div>
            <div className="admin-upcoming-list">{data.upcoming.map(booking => <Link key={booking.id} href={`/admin/bookings/${booking.id}/complete`} title={`Open booking for ${customers.get(booking.user_id)?.full_name ?? "Customer"}`}><time dateTime={booking.date_time}>{formatBookingTime(booking.date_time)}<small>{formatBookingDate(booking.date_time)}</small></time><span>{customers.get(booking.user_id)?.full_name ?? "Customer"}<small>{formatServiceLabel(booking.service_type, hasScalpNeckMassageAddon(booking.notes))}</small></span><StatusBadge status={booking.status} /></Link>)}</div>
            {!data.upcoming.length ? <p className="admin-empty">{error ? "Bookings unavailable." : "No upcoming bookings."}</p> : null}
          </section>
        </div>
        <div className="admin-detail-grid">
          <section className="admin-panel admin-recent" aria-labelledby="recent-title">
            <div className="admin-panel-heading"><h2 id="recent-title">Recent bookings</h2><Link href="/admin/bookings">View all <ArrowRight size={13} /></Link></div>
            <p className="admin-table-hint" id="recent-scroll-hint">Scroll sideways to see amounts, status, and booking links.</p><div className="admin-table-scroll" role="region" aria-label="Recent bookings table" aria-describedby="recent-scroll-hint" tabIndex={0}><table className="admin-booking-table"><thead><tr><th>Time</th><th>Customer</th><th>Service</th><th>Amount</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{data.recent.map(booking => <tr key={booking.id}><td>{formatBookingDate(booking.date_time)}<small>{formatBookingTime(booking.date_time)}</small></td><td>{customers.get(booking.user_id)?.full_name ?? "Customer"}</td><td>{formatServiceLabel(booking.service_type,hasScalpNeckMassageAddon(booking.notes))}</td><td>{money(collectedAmount(booking))}</td><td><StatusBadge status={booking.status} /></td><td><Link href={`/admin/bookings/${booking.id}/complete`} aria-label={`Open booking for ${customers.get(booking.user_id)?.full_name ?? "Customer"}`}><ArrowUpRight size={16} /></Link></td></tr>)}</tbody></table></div>
            {!data.recent.length ? <p className="admin-empty">{error ? "Bookings unavailable." : "No recent bookings."}</p> : null}
            <p className="admin-caption">Amounts are collected for completed visits; otherwise expected cash due.</p>
          </section>
          <section className="admin-panel" aria-labelledby="insights-title"><div className="admin-panel-heading"><h2 id="insights-title">Customer insights</h2><Link href="/admin/customers">View all <ArrowRight size={13} /></Link></div><dl className="admin-insights">
            <Insight icon={<UsersRound />} label="Total customers" value={value(data.totalCustomers)} />
            <Insight icon={<UserRound />} label="New customers" value={value(data.newCustomers)} />
            <Insight icon={<RotateCw />} label="Repeat customers" value={value(data.repeatClients)} />
            <Insight icon={<Heart />} label="Repeat visit rate" value={value(`${data.retention}%`)} />
          </dl><p className="admin-caption">Repeat visit rate: clients with 2+ completed visits, among all clients served.</p></section>
          <section className="admin-panel" aria-labelledby="top-title"><div className="admin-panel-heading"><div><h2 id="top-title">Top services <small>Last 30 days</small></h2><p>Completed appointments</p></div></div><ol className="admin-top-services">{data.topServices.map((item,index) => <li key={item.label}><strong>{index + 1}</strong><div><p>{item.label}<span>{value(item.count)} <small>{error ? "" : `${data.last30Completed ? Math.round(item.count / data.last30Completed * 100) : 0}%`}</small></span></p><progress value={item.count} max={Math.max(data.last30Completed,1)} aria-label={`${item.label}, ${item.count} completed visits`} /></div></li>)}</ol><p className="admin-caption">Massage is an add-on, not a separate appointment.</p></section>
        </div>
        <nav className="admin-shortcuts" aria-label="Admin tools">
          <Shortcut href="/admin/bookings" icon={<CalendarCheck />} label="Manage bookings" description="View and manage appointments" />
          <Shortcut href="/admin/customers" icon={<UsersRound />} label="Manage customers" description="View details and loyalty" />
          <Shortcut href="/admin/settings#services" icon={<Scissors />} label="Service settings" description="View services and pricing" />
          <Shortcut href="/admin/availability" icon={<Settings />} label="Manage availability" description="Set hours and blocked times" />
        </nav>
      </main>
    </>
  );
}

function Stat({icon,label,value,children}:{icon:React.ReactNode;label:string;value:string|number;children:React.ReactNode}) {
  return <article className="admin-stat"><span className="admin-stat-icon" aria-hidden="true">{icon}</span><h2>{label}</h2><strong>{value}</strong><div className="admin-stat-detail">{children}</div></article>;
}
function Change({current,previous,comparison,unavailable}:{current:number;previous:number;comparison:string;unavailable:boolean}) {
  if (unavailable) return <span>Comparison unavailable</span>;
  if (!previous) return <span>{current ? "No prior activity" : "No change"} · vs. {comparison}</span>;
  const change = Math.round((current - previous) / previous * 100);
  return <span><b className={change >= 0 ? "admin-positive" : "admin-negative"}>{change > 0 ? "+" : ""}{change}%</b> <span>vs. {comparison}</span></span>;
}
function Insight({icon,label,value}:{icon:React.ReactNode;label:string;value:string|number}) {
  return <div><dt><span aria-hidden="true">{icon}</span>{label}</dt><dd>{value}</dd></div>;
}
function Shortcut({href,icon,label,description}:{href:string;icon:React.ReactNode;label:string;description:string}) {
  return <Link href={href}><span aria-hidden="true">{icon}</span><span>{label}<small>{description}</small></span><ArrowRight size={16} /></Link>;
}
function RevenueChart({daily,metric}:{daily:ReturnType<typeof buildAdminDashboard>["daily"];metric:Metric}) {
  const peak = Math.max(...daily.map(day => day[metric]),1);
  const max = metric === "revenue" ? Math.ceil(peak / 50) * 50 : Math.ceil(peak / 4) * 4;
  const points = daily.map((day,index) => `${54 + index * 42},${180 - day[metric] / max * 145}`);
  return <><svg className="admin-line-chart" preserveAspectRatio="none" viewBox="0 0 620 216" role="img" aria-label={`${metric} per day for the last 14 days. Daily values available below.`}>
    <defs><linearGradient id="admin-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cbb277" stopOpacity=".3" /><stop offset="100%" stopColor="#cbb277" stopOpacity="0" /></linearGradient></defs>
    {[0,1,2,3,4].map(index => <g key={index}><line x1="48" x2="606" y1={180 - index * 36.25} y2={180 - index * 36.25} stroke="#b1b8a71c" /><text className="admin-chart-y-label" x="39" y={184 - index * 36.25} textAnchor="end">{metric === "revenue" ? "$" : ""}{max * index / 4}</text></g>)}
    <polygon points={`54,180 ${points.join(" ")} 600,180`} fill="url(#admin-chart-fill)" />
    <polyline points={points.join(" ")} fill="none" stroke="#cbb277" strokeWidth="2.5" strokeLinejoin="round" />
    {daily.map((day,index) => <g key={day.date}><circle cx={54 + index * 42} cy={180 - day[metric] / max * 145} r="3.5" fill="#cbb277"><title>{`${formatBookingDate(createBookingDateTime(day.date,"12:00"))}: ${metric === "revenue" ? money(day[metric]) : day[metric]}`}</title></circle>{(index % 2 === 0 && index !== 12) || index === 13 ? <text className={index === 0 || index === 6 || index === 13 ? undefined : "admin-chart-label-optional"} x={54 + index * 42} y="205" textAnchor={index === 0 ? "start" : index === 13 ? "end" : "middle"}>{new Intl.DateTimeFormat("en-US",{timeZone:BUSINESS_TIME_ZONE,month:"short",day:"numeric"}).format(createBookingDateTime(day.date,"12:00"))}</text> : null}</g>)}
  </svg><details className="admin-chart-data"><summary>View daily totals</summary><table><caption className="sr-only">Daily {metric}</caption><tbody>{daily.map(day => <tr key={day.date}><th>{formatBookingDate(createBookingDateTime(day.date,"12:00"))}</th><td>{metric === "revenue" ? money(day[metric]) : day[metric]}</td></tr>)}</tbody></table></details></>;
}
