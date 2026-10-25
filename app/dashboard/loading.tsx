export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10">
      <div className="h-4 w-20 animate-pulse rounded bg-[#e6e1d8]" />
      <div className="mt-4 h-10 w-80 max-w-full animate-pulse rounded bg-[#e6e1d8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#eeeae2]" />
      <div className="mt-10 h-64 animate-pulse rounded-2xl bg-white" />
    </main>
  );
}
