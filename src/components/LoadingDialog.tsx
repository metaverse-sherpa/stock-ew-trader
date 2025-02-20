import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { RefreshCw } from "lucide-react";

interface LoadingDialogProps {
  isOpen: boolean;
}

export function LoadingDialog({ isOpen }: LoadingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px] flex flex-col items-center justify-center p-12 gap-4">
        <DialogTitle className="sr-only">Loading</DialogTitle>
        <DialogDescription className="sr-only">
          Please wait while we load the stock data
        </DialogDescription>
        <RefreshCw className="h-6 w-6 animate-spin" />
        <p className="text-lg">Loading stocks...</p>
      </DialogContent>
    </Dialog>
  );
}
