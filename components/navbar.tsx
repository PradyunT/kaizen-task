import React from "react";
import { ModeToggle } from "./ModeToggle";

const navbar = () => {
  return (
    <div className="w-[20%] bg-secondary min-w-44 flex flex-col p-2 gap-2">
      <h2 className="h3 font-bold">Kaizen Task</h2>
      <hr className="border-t border-gray-600 w-[100%]" />
      <div>
        <h4 className="h4 mb-0">Kaizen</h4>
        <h4 className="p font-light">kaizen.task@gmail.com</h4>
      </div>
      <h4 className="h4">Habits</h4>
      <h4 className="h4">To-do List</h4>
      <h4 className="h4">Goals</h4>
      <div className="flex-grow" />
      <div>
        <ModeToggle />
      </div>
    </div>
  );
};

export default navbar;
