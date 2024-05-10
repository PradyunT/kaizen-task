"use client";
import React, { useEffect, useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, PlusIcon, TimerIcon, CheckIcon, FlagIcon } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { getCookie } from "cookies-next";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().min(2),
  date: z.date().optional(),
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
  isLate?: boolean;
  duration?: number;
  priority?: number;
}

const TodoPage = () => {
  const [todo, setTodo] = useState<Task[]>([]); // Updated useState declaration
  const [popout, setPopout] = useState(false);
  const { toast } = useToast();
  const [timer, setTimer] = useState<{
    time: number;
    initialTime: number;
    isActive: boolean;
    isFinished: boolean;
    taskId: number;
  }>({
    time: 0,
    initialTime: 0,
    isActive: false,
    isFinished: false,
    taskId: -1,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        // Update isLate if the task is late
        let today = new Date();
        let updatedData = data.map((task: Task) => {
          let taskDate = task.date ? new Date(task.date) : null;
          return {
            ...task,
            isLate: taskDate && taskDate < today,
          };
        });

        setTodo(updatedData);
      })
      .catch((error) => handleError(error));
  };

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
      priority: 1,
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
      date: values.date ? values.date.toISOString() : null,
      duration: values.duration ? parseInt(values.duration) : null,
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
      .then((response) => {
        return response.ok
          ? response
          : response.json().then((data) => {
              throw new Error(data);
            });
      })
      .then(() => {
        toast({
          title: "Task deleted successfully ✅",
        });
        // Refresh the todo list
        loadTodo();
      })
      .catch((error) => handleError(error));
  }

  function handleStartTimer(task_id: number, duration: number) {
    setTimer({ time: duration * 60, initialTime: duration * 60, isActive: true, isFinished: false, taskId: task_id });
    intervalRef.current = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer.time <= 1) {
          clearInterval(intervalRef.current!);
          toast({ title: "Time's up!", description: `Timer for task ${task_id} has finished.` });
          return { ...prevTimer, isFinished: true, time: 0 };
        }
        return { ...prevTimer, time: prevTimer.time - 1 };
      });
    }, 1000);
  }

  function handleStopTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimer({ ...timer, isActive: false, time: 0, taskId: -1 });
  }

  // Load todo list upon page load in
  useEffect(() => {
    loadTodo();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const Task = ({ task_id, checked, title, description, date, duration, isLate, priority }: Task) => {
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
        <p className={`${isLate && "text-red-400"}`}>{date ? formatDate(date) : "No date"}</p>
        <p>{duration ? `${duration} minutes` : "No duration"}</p>
        <p>
          <FlagIcon className="inline mr-1" />
          {priority ? `P${priority}` : "No priority"}
        </p>
        {duration && (
          <Button onClick={() => handleStartTimer(task_id, duration)}>
            <TimerIcon />
          </Button>
        )}
        <Button onClick={() => handleDeleteTask(task_id)}>
          <CheckIcon />
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
          <Task key={index} {...task} />
        ))}
        {!popout && (
          <Button onClick={() => setPopout(true)}>
            <PlusIcon />
          </Button>
        )}
      </div>
      {/* Task timer dialog */}
      {timer.isActive && (
        <Dialog open={timer.isActive} onOpenChange={(isOpen) => !isOpen && handleStopTimer()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Task Timer</DialogTitle>
              <DialogDescription>
                <p className="p mb-1">
                  Time left: {Math.floor(timer.time / 60)}:{timer.time % 60}
                </p>
                <Progress value={(1 - timer.time / timer.initialTime) * 100} />
              </DialogDescription>
            </DialogHeader>
            {timer.isFinished ? (
              <Button
                onClick={() => {
                  handleStopTimer();
                  handleDeleteTask(timer.taskId);
                }}>
                Mark Completed <CheckIcon className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleStopTimer}>Stop Timer</Button>
            )}
          </DialogContent>
        </Dialog>
      )}
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
