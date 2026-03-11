import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, LogOut, MapPin, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { BrandWithDetails } from "@/lib/database.types";

async function fetchBrands(): Promise<BrandWithDetails[]> {
  const { data, error } = await supabase
    .from("Brand")
    .select("*, Locations(location_id, city, state), Products(product_id, product_type)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BrandWithDetails[];
}

async function deleteBrand(brand_id: number) {
  // Delete child rows first (FK constraint)
  await supabase.from("Locations").delete().eq("brand_id", brand_id);
  await supabase.from("Products").delete().eq("brand_id", brand_id);
  const { error } = await supabase.from("Brand").delete().eq("brand_id", brand_id);
  if (error) throw error;
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: fetchBrands,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.success("Brand deleted.");
    },
    onError: () => toast.error("Delete failed. Please try again."),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-lg">Lokal-Map Admin</h1>
            <p className="text-xs text-muted-foreground">Manage brands, locations & products</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              View Site
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate("/admin/login", { replace: true });
              }}
            >
              <LogOut className="w-4 h-4 mr-1" /> Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">
            Brands {!isLoading && <span className="text-muted-foreground text-lg">({brands.length})</span>}
          </h2>
          <Button onClick={() => navigate("/admin/brands/new")}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Brand
          </Button>
        </div>

        {isLoading && (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && brands.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg font-medium">Belum ada brand lagi.</p>
            <p className="text-sm mt-1">Klik "Tambah Brand" untuk mulakan.</p>
          </div>
        )}

        <div className="grid gap-3">
          {brands.map((brand) => (
            <div
              key={brand.brand_id}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{brand.brand_name || "(no name)"}</p>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {brand.brand_description || "—"}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {brand.Locations.length} lokasi
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="w-3 h-3" />
                    {brand.Products.length} produk
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/brands/${brand.brand_id}/edit`)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(brand.brand_id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam brand?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua lokasi dan produk untuk brand ini akan dipadam sekaligus. Tindakan ini tidak boleh
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget !== null) deleteMutation.mutate(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Ya, Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
