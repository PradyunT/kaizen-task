"use client";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface Task {
  checked: boolean;
  title: string;
  description: string;
  date: string;
}

const TodoPage = () => {
  const [todo, setTodo] = useState<Task[]>([]); // Updated useState declaration

  const loadTodo = () => {
    // TODO: Make GET request to server and get user's todo list
    // Example hardcoded todo data
    const todoData: Task[] = [
      {
        checked: false,
        title: "Code this project asdadfsdfsdf",
        description:
          "I was part of something special. Yes, Yes, without the oops! Checkmate... What do they got in there? King Kong? Eventually, you do plan to have dinosaurs on your dinosaur tour, right? Checkmate... Jaguar shark! So tell me - does it really exist? Remind me to thank John for a lovely weekend.",
        date: new Date().toUTCString(),
      },
      {
        checked: true,
        title: "title 2",
        description: "description 2",
        date: new Date().toUTCString(),
      },
    ];
    setTodo(todoData);
  };

  useEffect(() => {
    loadTodo();
  }, []);

  return (
    <div>
      <h2 className="h2 mx-auto mb-4">To-do List</h2>
      {todo.map((task, index) => (
        <Task key={index} {...task} /> // Render each task component
      ))}
    </div>
  );
};

const Task = ({ checked, title, description, date }: Task) => {
  // Function body
  return (
    <div className="border-2 rounded-sm border-white flex flex-row gap-3 p-3">
      <Checkbox id={title} defaultChecked={checked} className="my-auto" />
      <div>
        <h4 className={`h4 ${checked && "line-through"}`}>{title}</h4>
        <p className={`p ${checked && "line-through"}`}>{description}</p>
      </div>
      <p>{date}</p>
    </div>
  );
};

export default TodoPage;
