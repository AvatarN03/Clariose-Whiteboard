"use client";
import React, { ReactNode, useEffect } from 'react'
import axios from 'axios';

const Provider = ({children}:{children:ReactNode}) => {

  const CreateNewUser = async () => {
    const result = await axios.post('/api/users');
    console.log(result.data);
    return result.data;
  };

  useEffect(() => {
    CreateNewUser();
  }, []);


  return (
    <div>{children}</div>
  )
}

export default Provider