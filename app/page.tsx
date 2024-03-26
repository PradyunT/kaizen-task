"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

const registerFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters" })
    .max(50, { message: "Username must be less than 50 characters" }),
  email: z.string().min(2),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

const loginFormSchema = z.object({
  email: z.string().min(2),
  password: z.string().min(3, { message: "Password must be at least 3 characters" }),
});

export default function AuthPage() {
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function handleRegister(values: z.infer<typeof registerFormSchema>) {
    setLoading(true);
    // Send POST request to server
    fetch("http://localhost:4875/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            toast({
              variant: "destructive",
              title: "Failed to register ❌",
              description: `${data}`,
            });
            setError(data); // Display the error message
            throw new Error("Failed to register user");
          });
        }
        return response.json();
      })
      .then((data) => {
        toast({
          title: "Registered Successfully ✅",
        });
        // Set token in local storage
        localStorage.setItem("token", data.token);
        // Redirect to home page
        window.location.replace("/home");
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function handleLogin(values: z.infer<typeof loginFormSchema>) {
    setLoading(true);
    // Send POST request to server
    fetch("http://localhost:4875/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            toast({
              variant: "destructive",
              title: "Failed to login ❌",
              description: `${data}`,
            });
            setError(data); // Display the error message
            throw new Error("Failed to login user");
          });
        }
        return response.json();
      })
      .then((data) => {
        toast({
          title: "Logged In Successfully ✅",
        });
        // Set token in local storage
        localStorage.setItem("token", data.token);
        // Redirect to home page
        window.location.replace("/home");
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="h2 border-b pb-2 mb-4">Login</h1>
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
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
                        <Input {...field} />
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
                        <Input {...field} />
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
