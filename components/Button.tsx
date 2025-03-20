"use client";

import React, { ReactNode, MouseEventHandler } from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean; // ✅ 추가!
}

const Button = ({ onClick, children, className = "" }: ButtonProps) => {
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
};

export default Button;
