"use client";

import { Button } from "@/components/ui/button";

export function SubmitDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h3 className="text-lg font-semibold">Submit test?</h3>
        <p className="mt-2 text-sm text-slate-500">
          You cannot change answers after submitting.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Continue exam
          </Button>
          <Button onClick={onConfirm}>Submit</Button>
        </div>
      </div>
    </div>
  );
}
