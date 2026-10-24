"use client";
import React, { ReactNode, useEffect } from "react";
import axios from "axios";
import { UserDetailContext } from "@/context/userDetail";

const Provider = ({ children }: { children: ReactNode }) => {

  const [userDetail, setUserDetail] = React.useState<any>(null);


  const CreateNewUser = async () => {
    const result = await axios.post("/api/users");
    setUserDetail(result.data);
    console.log(result.data);
    return result.data;
  };

  useEffect(() => {
    CreateNewUser();
  }, []);

  return (
    <UserDetailContext.Provider value={{
      userDetail,
      setUserDetail
    }}>
      <div>{children}</div>
    </UserDetailContext.Provider>
  );
};

export default Provider;
