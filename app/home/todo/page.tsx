"use client";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Plus, PlusIcon, TimerIcon, TrashIcon } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { getCookie } from "cookies-next";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().min(2),
  date: z.date(),
  duration: z.string().regex(/^\d+$/).min(1).optional(),
  priority: z.number().optional(),
});

interface Task {
  task_id: number;
  user_email: string;
  checked: boolean;
  title: string;
  description: string;
  date?: string;
  duration?: number;
  priority?: number;
}

const TodoPage = () => {
  const [todo, setTodo] = useState<Task[]>([]); // Updated useState declaration
  const [popout, setPopout] = useState(false);
  const { toast } = useToast();

  const loadTodo = () => {
    // Get user's todo list
    let email = getCookie("email");
    let token = getCookie("token");

    fetch(`http://localhost:4875/tasks/${email}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(handleResponse)
      .then((data) => {
        console.log(data);
        setTodo(data);
      })
      .catch((error) => handleError(error));
  };

  // Load todo list upon page load in
  useEffect(() => {
    loadTodo();
  }, []);

  const handleCheck = (id: number) => {
    // TODO implement checking logic
    // TODO Update task serverside and refresh
    // setTodo(updatedTodo);
    // loadTodo();
  };

  const addTaskForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      duration: "",
      priority: 1, // Default priority added
    },
  });

  async function handleAddTask(values: z.infer<typeof formSchema>) {
    toast({ title: "Adding task..." });
    const token = getCookie("token");
    let email = getCookie("email");

    if (!token) {
      toast({ title: "You must be logged in to manage tasks ❌" });
      return;
    }

    // Prepare body for request to server
    const requestBody = {
      ...values,
      user_email: email,
      date: values.date.toISOString(),
      duration: parseInt(values.duration || "-1"),
      priority: values.priority || 1,
    };

    await fetch("http://localhost:4875/tasks/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then(handleResponse)
      .then(() => {
        // Handle success
        toast({
          title: "Task added successfully ✅",
        });
        // Refresh the todo list
        loadTodo();
      })
      .catch((error) => handleError(error));
  }

  function formatDate(inputDate: string): string {
    // If date falls within today
    let today = new Date();
    let taskDate = new Date(inputDate);

    if (taskDate.getDay() == today.getDay()) {
      return "Today";
    } else {
      return format(taskDate, "PPP");
    }
  }

  function handleResponse(response: Response) {
    return response.ok
      ? response.json()
      : response.json().then((data) => {
          throw new Error(data);
        });
  }

  function handleError(error: any) {
    console.error(error);
    toast({ variant: "destructive", title: "Operation failed ❌", description: error.message || "An error occurred" });
  }

  async function handleDeleteTask(id: number) {
    toast({ title: "Deleting task... 🔃" });
    const token = getCookie("token");

    if (!token) {
      toast({ title: "You must be logged in to manage tasks ❌" });
      return;
    }

    await fetch(`http://localhost:4875/tasks/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(handleResponse)
      .then(() => {
        toast({
          title: "Task deleted successfully ✅",
        });
        // Refresh the todo list
        loadTodo();
      })
      .catch((error) => handleError(error));
  }

  const Task = ({ task_id, checked, title, description, date, duration, priority }: Task) => {
    // Function body
    return (
      <div className="border-2 rounded-sm border-gray-400 flex flex-col sm:flex-row gap-3 p-3 my-1">
        <Checkbox
          id={task_id.toString()}
          defaultChecked={checked}
          className="my-auto"
          onCheckedChange={() => handleCheck(task_id)}
        />
        <div className="sm:flex-1">
          <h4 className={`h4 ${checked && "line-through"}`}>{title}</h4>
          <p className={`p ${checked && "line-through"}`}>{description}</p>
        </div>
        <p>{date ? formatDate(date) : "No date"}</p>
        <p>{duration ? `${duration} minutes` : "No duration"}</p>
        <p>{priority ? `P${priority}` : "No priority"}</p>
        {duration && (
          <Button>
            <TimerIcon />
          </Button>
        )}
        <Button>
          <TrashIcon onClick={() => handleDeleteTask(task_id)} />
        </Button>
      </div>
    );
  };

  return (
    <div>
      <h2 className="h2 mx-auto mb-4">To-do List</h2>
      {/* Todo list */}
      <div className="flex flex-col gap-1">
        {todo.map((task, index) => (
          <Task key={index} {...task} /> // Render each task component
        ))}
        {!popout && (
          <Button onClick={() => setPopout(true)}>
            <PlusIcon />
          </Button>
        )}
      </div>
      {/* Add tasks */}
      {popout && (
        <div>
          <Form {...addTaskForm}>
            <form onSubmit={addTaskForm.handleSubmit(handleAddTask)} className="space-y-2">
              <FormField
                control={addTaskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl className="border-none">
                      <Input placeholder="Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addTaskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl className="border-none">
                      <Input placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-row">
                <FormField
                  control={addTaskForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl className="border-none">
                        <Input placeholder="15 (minutes)" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addTaskForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl className="border-none">
                            <Button
                              variant={"outline"}
                              className={cn("min-w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <Button variant="secondary" type="submit" className="mr-2">
                  Add
                </Button>
                <Button variant="outline" onClick={() => setPopout(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

export default TodoPage;
