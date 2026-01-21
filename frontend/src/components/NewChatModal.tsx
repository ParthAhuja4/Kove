import type { User } from "../types/index";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface NewChatModalProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onClose: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

const NewChatModal = ({
  users,
  onSelectUser,
  onClose,
  onLoadMore,
  hasMore,
}: NewChatModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
          <DialogDescription>
            Select a user to start a new conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2 max-h-[300px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">No users found.</p>
          ) : (
            filteredUsers.map((user) => (
              <Button
                key={user._id}
                variant="ghost"
                className="justify-start px-4 py-2"
                onClick={() => onSelectUser(user)}
              >
                {user.name} ({user.email})
              </Button>
            ))
          )}
          {hasMore && (
            <Button variant="ghost" onClick={onLoadMore} className="mt-4">
              Load More
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
