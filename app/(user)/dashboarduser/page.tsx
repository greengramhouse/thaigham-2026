import { Users, DollarSign, Activity, CreditCard, ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";

export default function UserDashboard() {
  return (
    <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">My Dashboard</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Here's your latest activity summary.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            Download Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Personal Revenue" amount="$1,231.89" trend="+10.1%" isPositive={true} icon={DollarSign} />
        <MetricCard title="My Points" amount="350" trend="+12" isPositive={true} icon={Users} />
        <MetricCard title="Purchases" amount="12" trend="-1" isPositive={false} icon={CreditCard} />
        <MetricCard title="Active Streak" amount="5 days" trend="+1" isPositive={true} icon={Activity} subtitle="since last week" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Chart Section */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-900/50">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Activity Overview</h3>
            <p className="text-sm text-zinc-500">Your performance over the current year</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full border-t border-zinc-100 dark:border-zinc-800/50 h-0"></div>
              ))}
            </div>
            
            {/* Bars */}
            <div className="h-[250px] w-full flex items-end justify-between gap-2 sm:gap-3 relative z-10 mt-4">
              {[40, 70, 30, 85, 45, 60, 90, 50, 65, 80, 55, 75].map((height, i) => (
                <div key={i} className="w-full group relative flex flex-col items-center justify-end h-full">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs py-1 px-2 rounded transition-opacity pointer-events-none">
                    {height}%
                  </div>
                  <div 
                    className="w-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 rounded-t-sm transition-all duration-300"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Activity Section */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-900/50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Recent Transactions</h3>
              <p className="text-sm text-zinc-500">Your recent history.</p>
            </div>
          </div>
          <div className="p-6 flex-1">
            <div className="space-y-6">
              {[
                { name: "Pro Plan Subscription", date: "Today, 10:23 AM", amount: "-$19.00", status: "completed" },
                { name: "Refund Processed", date: "Yesterday", amount: "+$39.00", status: "completed" },
                { name: "Course Purchase", date: "May 12, 2026", amount: "-$299.00", status: "completed" },
                { name: "Domain Renewal", date: "May 10, 2026", amount: "-$12.00", status: "completed" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-medium text-zinc-600 dark:text-zinc-300 text-sm">
                      {item.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</div>
                    <div className="text-sm text-zinc-500 truncate">{item.date}</div>
                  </div>
                  <div className={`text-sm font-bold ${item.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {item.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component สำหรับการ์ดสถิติ
function MetricCard({ title, amount, trend, isPositive, icon: Icon, subtitle = "from last month" }: any) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
        <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
          <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>
      <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{amount}</div>
      <p className="text-sm mt-2 flex items-center gap-1.5 text-zinc-500">
        <span className={`flex items-center font-medium px-1.5 py-0.5 rounded-md ${
          isPositive ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10"
        }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
        <span className="truncate">{subtitle}</span>
      </p>
    </div>
  );
}
