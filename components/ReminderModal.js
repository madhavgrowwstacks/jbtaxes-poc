"use client";
import { useEffect, useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useStore } from "./store";
import { Avatar, Button, Field, Modal, Segmented, useToast } from "./ui";

function firstName(client) {
  return client.type === "1040" ? client.name.split(" ")[0] : client.name;
}

export function reminderTemplate(client, items) {
  if (!items.length) {
    return `Hi ${firstName(client)}, this is JB Taxes checking in on your 2025 return. Reply here if you have any questions — we're on it!`;
  }
  return `Hi ${firstName(client)}, this is JB Taxes. We're still waiting on: ${items
    .map((i) => i.doc)
    .join("; ")}. You can upload them securely in your client portal. Thank you!`;
}

export default function ReminderModal({ client, open, onClose, onSent, title = "Send reminder", defaultMessage }) {
  const { outstanding, actions } = useStore();
  const toast = useToast();
  const [channel, setChannel] = useState("SMS");
  const [message, setMessage] = useState("");

  const items = client ? outstanding(client.id) : [];

  useEffect(() => {
    if (!open || !client) return;
    setChannel(client.channel === "SMS" ? "SMS" : "Email");
    setMessage(defaultMessage ?? reminderTemplate(client, outstanding(client.id)));
    // Only reset the draft when the dialog opens for a client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id]);

  if (!client) return null;

  const send = () => {
    actions.sendReminder(client.id, channel, null, message.trim());
    toast({ title: `Reminder sent to ${client.name}`, description: `Delivered by ${channel} · last nudge updated to just now` });
    onSent?.(client.id);
    onClose();
  };

  const smsParts = Math.max(1, Math.ceil(message.length / 160));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Messages are logged to the client's communication history."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Send} onClick={send} disabled={!message.trim()}>
            Send {channel === "SMS" ? "SMS" : "email"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={client.name} size={40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{client.name}</div>
          <div className="text-2" style={{ fontSize: 13 }}>
            {channel === "SMS" ? client.phone : client.email} · {items.length} item{items.length === 1 ? "" : "s"} outstanding
          </div>
        </div>
      </div>
      <Field label="Channel">
        <Segmented
          block
          value={channel}
          onChange={setChannel}
          ariaLabel="Channel"
          options={[
            { value: "SMS", label: "SMS", icon: MessageSquare },
            { value: "Email", label: "Email", icon: Mail },
          ]}
        />
      </Field>
      <Field
        label="Message"
        htmlFor="reminder-message"
        hint={channel === "SMS" ? `${message.length} characters · ${smsParts} SMS segment${smsParts > 1 ? "s" : ""}` : "Sent from jasmin@jbtaxes.example"}
      >
        <textarea id="reminder-message" className="textarea" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} data-autofocus />
      </Field>
    </Modal>
  );
}
