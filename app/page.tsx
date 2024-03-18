"use client";

import { useState } from "react";
import { invoke } from "@tauri-apps/api";
import { Button } from "@/components/ui/button";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// import { fetch } from "@tauri-apps/api/http";

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters" })
    .max(50, { message: "Username must be less than 50 characters" }),
  email: z.string().min(2),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export default function AuthPage() {
  const [menu, setMenu] = useState("login");
  const [error, setError] = useState("");

  const registerForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const loginForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function handleRegister(values: z.infer<typeof formSchema>) {
    // Send POST request to server
    fetch("http://localhost:4875/auth/register_user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            setError(data); // Display the error message
            throw new Error("Failed to register user");
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Auth Page</h1>
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <>
            <h1 className="text-lg font-bold">Login</h1>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleRegister)} className="space-y-8">
                <FormField
                  control={loginForm.control}
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
                <Button type="submit">Login</Button>
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
                <Button type="submit">Register</Button>
                <h1 className="text-md text-red-500">{error}</h1>
              </form>
            </Form>{" "}
          </>
        </TabsContent>
      </Tabs>
    </div>
  );
}
