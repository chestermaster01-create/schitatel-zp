import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePoints } from "@/lib/salary";

export function PointSwitcher() {
  const { points, current, counts, select, add, rename, remove } = usePoints();
  const [mode, setMode] = useState<"add" | "rename" | null>(null);
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState(false);
  const cur = points.find((p) => p.id === current);

  const save = () => {
    const n = name.trim();
    if (!n) return;
    if (mode === "add") add(n);
    else if (mode === "rename") rename(current, n);
    setMode(null);
  };

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
      <MapPin className="h-4 w-4 text-muted-foreground ml-1" />
      <select
        value={current}
        onChange={(e) => select(e.target.value)}
        className="h-8 rounded bg-transparent px-1 text-sm font-medium max-w-[180px]"
        aria-label="Пункт"
      >
        {points.map((p) => (
          <option key={p.id} value={p.id}>{p.name} ({counts[p.id] ?? 0})</option>
        ))}
      </select>
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Новый пункт"
        onClick={() => { setName(""); setMode("add"); }}>
        <Plus className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Переименовать пункт"
        onClick={() => { setName(cur?.name ?? ""); setMode("rename"); }}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Удалить пункт"
        disabled={points.length <= 1} onClick={() => setConfirm(true)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={mode != null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Новый пункт" : "Переименовать пункт"}</DialogTitle>
          </DialogHeader>
          <Input autoFocus placeholder="Название пункта" value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()} />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setMode(null)}>Отмена</Button>
            <Button onClick={save}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пункт?</AlertDialogTitle>
            <AlertDialogDescription>
              «{cur?.name}» будет удалён вместе со всеми сотрудниками и выручкой. Действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove(current)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
