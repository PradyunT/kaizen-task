"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { hasCookie, setCookie } from "cookies-next";

const registerFormSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().min(2),
  password: z.string().min(8),
});

const loginFormSchema = z.object({
  email: z.string().min(2),
  password: z.string().min(3),
});

export default function AuthPage() {
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      console.log("Checking auth!");
      if (hasCookie("token")) {
        window.location.replace("/home");
      }
    };
    checkAuth();
  }, []);

  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  function handleResponse(response: Response) {
    return response.ok
      ? response.json()
      : response.json().then((data) => {
          throw new Error(data);
        });
  }

  function handleRegister(values: z.infer<typeof registerFormSchema>) {
    toast({ title: "Logging in... 🔃" });
    setLoading(true);
    fetch("http://localhost:4875/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then(handleResponse)
      .then((data) => {
        setCookiesAndRedirect(data);
        setLoading(false); // Move setLoading inside then block
      })
      .catch((error) => {
        handleError(error);
        setLoading(false); // Move setLoading inside catch block
      });
  }

  function handleLogin(values: z.infer<typeof loginFormSchema>) {
    toast({ title: "Logging in... 🔃" });
    setLoading(true);
    fetch("http://localhost:4875/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then(handleResponse)
      .then((data) => {
        setCookiesAndRedirect(data);
        setLoading(false); // Move setLoading inside then block
      })
      .catch((error) => {
        handleError(error);
        setLoading(false); // Move setLoading inside catch block
      });
  }

  function setCookiesAndRedirect(data: any) {
    const currentDate = new Date();
    const expirationDate = new Date(currentDate);
    expirationDate.setDate(currentDate.getDate() + 3);
    console.log(data);
    console.log("setting cookies!");
    setCookie("token", data.token, { sameSite: true, expires: expirationDate });
    setCookie("username", data.user_username, { sameSite: true, expires: expirationDate });
    setCookie("email", data.user_email, { sameSite: true, expires: expirationDate });
    window.location.replace("/home");
  }

  function handleError(error: any) {
    console.error(error);
    setError(error.message || "An error occurred");
    toast({ variant: "destructive", title: "Operation failed ❌", description: error.message || "An error occurred" });
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="h2 border-b pb-2 mb-4">Login</h1>
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="w-[100%]">
          <TabsTrigger value="login" className="w-[50%]">
            Login
          </TabsTrigger>
          <TabsTrigger value="register" className="w-[50%]">
            Register
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <>
            <h2 className="text-lg font-bold">Login</h2>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-8">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Kai.Zen@gmail.com" {...field} />
                      </FormControl>
                      <FormDescription>Your email.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>Your password.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading}>
                  Login
                </Button>
                <h1 className="text-md text-red-500">{error}</h1>
              </form>
            </Form>{" "}
          </>
        </TabsContent>
        <TabsContent value="register">
          <>
            <h1 className="text-lg font-bold">Register</h1>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-8">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Kai" {...field} />
                      </FormControl>
                      <FormDescription>Your display name (can be changed later).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Kai.zen@gmail.com" {...field} />
                      </FormControl>
                      <FormDescription>Your email.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>Your password.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading}>
                  Register
                </Button>
                <h1 className="text-md text-red-500">{error}</h1>
              </form>
            </Form>{" "}
          </>
        </TabsContent>
      </Tabs>
    </div>
  );
}
