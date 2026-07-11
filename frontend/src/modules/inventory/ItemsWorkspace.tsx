import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ItemsWorkspace() {
  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
}
