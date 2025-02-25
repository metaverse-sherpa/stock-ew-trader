import React from "react";
import { useToast } from "./ui/use-toast.tsx";      
import { Button } from "./ui/button.tsx";

export const TestButton = () => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "Test Toast",
      description: "This is a test toast message.",
    });
  };

  return (
    <Button onClick={handleClick}>
      Test Toast
    </Button>
  );
}; 