import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Logo from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import AvatarWithBadge from "@/components/avatar-with-badge";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import AlertDialogPopup from "@/components/alert-dialog-popup";

const Account = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formSchema = z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(50, "Name must be less than 50 characters"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await API.put("/users/profile", { name: values.name });
      setUser(res.data.user);
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await API.delete("/users/account");
      toast.success("Account deleted successfully");
      localStorage.removeItem("auth-storage");
      window.location.href = "/sign-in";
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </Button>
              <Logo showText={false} imgClass="size-8" />
            </div>
            <CardTitle className="text-lg">My Account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex flex-col items-center gap-4">
              <AvatarWithBadge
                name={user?.name || "Unknown"}
                src={user?.avatar || ""}
                isOnline={true}
                size="size-20"
                className="text-3xl"
              />
              <div className="text-center">
                <p className="font-medium text-lg">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cursor-pointer"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <Save className="mr-2" size={16} />
                  )}
                  Save Changes
                </Button>
              </form>
            </Form>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Danger zone: Once you delete your account, there is no going
                back.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full cursor-pointer"
              >
                <Trash2 className="mr-2" size={16} />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialogPopup
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        onDelete={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
      />
    </div>
  );
};

export default Account;
