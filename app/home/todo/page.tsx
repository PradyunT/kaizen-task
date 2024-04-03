"use client";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Plus, PlusIcon } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().min(2),
  date: z.date(),
  duration: z.string().regex(/^\d+$/).min(1),
});

interface Task {
  id: string;
  checked: boolean;
  title: string;
  description: string;
  date?: Date;
  duration?: string;
  priority?: number;
}

const TodoPage = () => {
  const [todo, setTodo] = useState<Task[]>([]); // Updated useState declaration
  const [popout, setPopout] = useState(false);

  const loadTodo = () => {
    // TODO: Make GET request to server and get user's todo list
    // Example hardcoded todo data
    const todoData: Task[] = [
      {
        id: "ijaofd897",
        checked: false,
        title: "Code this project asdadfsdfsdf",
        description:
          "I was part of something special. Yes, Yes, without the oops! Checkmate... What do they got in there? King Kong?",
        date: new Date(),
        duration: new Date().getMinutes().toLocaleString(),
        priority: 1,
      },
      {
        id: "ia3ofd897",
        checked: true,
        title: "title 2",
        description: "description 2",
        date: new Date(),
        duration: new Date().getMinutes().toLocaleString(),
        priority: 1,
      },
    ];
    setTodo(todoData);
  };

  const handleCheck = (id: string) => {
    const updatedTodo: Task[] = todo.map((task) => (task.id === id ? { ...task, checked: !task.checked } : task));
    // TODO Update task serverside and refresh
    setTodo(updatedTodo);
  };

  useEffect(() => {
    loadTodo();
  }, []);

  const addTaskForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      duration: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmitAddTask(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  function formatDate(inputDate: Date): String {
    // If date falls within today
    let today = new Date();
    if (inputDate.getDay() == today.getDay()) {
      return "Today";
    } else {
      return inputDate.getDate().toLocaleString();
    }
  }

  const Task = ({ id, checked, title, description, date, duration, priority }: Task) => {
    // Function body
    return (
      <div className="border-2 rounded-sm border-gray-400 flex flex-col sm:flex-row gap-3 p-3 my-1">
        <Checkbox id={id} defaultChecked={checked} className="my-auto" onCheckedChange={() => handleCheck(id)} />
        <div className="sm:flex-1">
          <h4 className={`h4 ${checked && "line-through"}`}>{title}</h4>
          <p className={`p ${checked && "line-through"}`}>{description}</p>
        </div>
        <p>{date && formatDate(date)}</p>
        <p>{duration} minutes</p>
        <p>{priority && `P${priority}`}</p>
      </div>
    );
  };

  return (
    <div>
      <h2 className="h2 mx-auto mb-4">To-do List</h2>
      {/* Todo list */}
      <div>
        {todo.map((task, index) => (
          <Task key={index} {...task} /> // Render each task component
        ))}
      </div>
      {!popout && (
        <Button onClick={() => setPopout(true)}>
          <PlusIcon />
        </Button>
      )}
      {/* Add tasks */}
      {popout && (
        <div>
          <Form {...addTaskForm}>
            <form onSubmit={addTaskForm.handleSubmit(onSubmitAddTask)} className="space-y-2">
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
                              {field.value ? <p>{field.value.toLocaleString()}</p> : <span>Pick a date</span>}
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
