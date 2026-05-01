import { useState } from "react";

export function useUsersStore() {
  const [users, setUsers] = useState<Record<string, any>>({});

  const updateUser = (user: any) => {
    setUsers((prev) => ({
      ...prev,
      [user.userId]: {
        ...prev[user.userId],
        ...user,
      },
    }));
  };

  return { users, updateUser };
}
