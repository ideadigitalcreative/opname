import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuditLogsCollection } from "@/lib/services/master-data";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const actionTones: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  stock_in_created: "blue",
  stock_in_applied: "green",
  stock_out_created: "blue",
  stock_out_applied: "green",
  product_created: "blue",
  product_updated: "amber",
  product_deleted: "red",
  opname_item_updated: "blue",
  opname_status_changed: "amber",
  opname_correction_applied: "green",
  user_invited: "blue",
  user_role_updated: "amber",
  user_deactivated: "red",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filterAction = getSearchValue(resolvedSearchParams.action);
  const filterEntity = getSearchValue(resolvedSearchParams.entity);
  const filterUser = getSearchValue(resolvedSearchParams.user);

  const result = await getAuditLogsCollection();

  const filteredItems = result.items.filter((item) => {
    const matchesAction = !filterAction || item.action === filterAction;
    const matchesEntity = !filterEntity || item.entityType === filterEntity;
    const matchesUser = !filterUser || item.actor.toLowerCase().includes(filterUser.toLowerCase());
    return matchesAction && matchesEntity && matchesUser;
  });

  const uniqueActions = [...new Set(result.items.map((i) => i.action))].sort();
  const uniqueEntities = [...new Set(result.items.map((i) => i.entityType))].sort();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Audit Trail"
        title="Audit Log"
        description="Pantau aktivitas penting seperti login, perubahan barang, input opname, approval, dan koreksi stok."
      />

      {result.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {result.note}
        </div>
      ) : null}

      <form method="get">
        <FilterBar>
          <select
            name="action"
            defaultValue={filterAction}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          >
            <option value="">Semua action</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            name="entity"
            defaultValue={filterEntity}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          >
            <option value="">Semua entity</option>
            {uniqueEntities.map((entity) => (
              <option key={entity} value={entity}>
                {entity.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <input
            name="user"
            defaultValue={filterUser}
            placeholder="Filter user..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Filter
          </button>
        </FilterBar>
      </form>

      {filteredItems.length > 0 ? (
        <DataTable
          columns={[
            { label: "Action" },
            { label: "Entity" },
            { label: "Entity ID", hideOnMobile: true },
            { label: "Actor" },
            { label: "Waktu", hideOnMobile: true },
          ]}
          rows={filteredItems.map((item) => [
            <StatusBadge
              key={`action-${item.id}`}
              label={item.action.replaceAll("_", " ")}
              tone={actionTones[item.action] ?? "slate"}
            />,
            item.entityType,
            item.entityId,
            item.actor,
            new Date(item.createdAt).toLocaleString("id-ID"),
          ])}
        />
      ) : (
        <EmptyState
          title="Tidak ada audit log ditemukan"
          description="Coba ubah filter atau lakukan aktivitas yang tercatat."
        />
      )}
    </div>
  );
}
