import { ColumnDef } from "@tanstack/react-table";
import { Route } from "@/interface/modal";

export const getPoliceStationColumns = (
  onEdit?: (row: Route) => void,
  onDelete?: (row: Route) => void
): ColumnDef<Route>[] => [
  {
    header: "State",
    accessorKey: "state_name",
  },
  {
    header: "District",
    accessorKey: "district_name",
  },
  {
    header: "City",
    accessorKey: "city_name",
  },
  {
    header: "Pincode",
    accessorKey: "pincode",
  },
  {
    header: "Address",
    accessorKey: "address",
  },
];
