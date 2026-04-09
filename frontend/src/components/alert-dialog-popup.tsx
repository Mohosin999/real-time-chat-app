import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type AlertDialogPopupProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onDelete: () => void;
  title?: string;
  description?: string;
  actionText?: string;
};

const AlertDialogPopup = ({
  open,
  setOpen,
  onDelete,
  title = "Delete",
  description = "Are you sure?",
  actionText = "Delete",
}: AlertDialogPopupProps) => {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogPopup;
