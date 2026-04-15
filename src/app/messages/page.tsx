"use client";
import { useState } from "react";
import { Send, Paperclip, User, Sparkles } from "lucide-react";

const mockMessages = [
  { id: 1, from: "aimio", name: "Sarah M. — Gestionnaire IA", time: "Aujourd'hui, 9:45", text: "Bonjour Terri! J'ai livre 3 nouveaux candidats pour le poste d'estimateur senior ce matin. Sophie Lavoie est particulierement forte — score de 9.5/10. Je vous recommande de la rencontrer rapidement car elle est en processus ailleurs." },
  { id: 2, from: "client", name: "Terri Sauro", time: "Aujourd'hui, 10:12", text: "Merci Sarah! Sophie a l'air excellente. Est-ce qu'elle serait disponible pour une entrevue mercredi prochain?" },
  { id: 3, from: "aimio", name: "Sarah M. — Gestionnaire IA", time: "Aujourd'hui, 10:18", text: "Je viens de verifier avec elle. Mercredi 16 avril a 10h ou 14h fonctionnerait. Quelle heure preferez-vous?" },
  { id: 4, from: "client", name: "Terri Sauro", time: "Aujourd'hui, 10:22", text: "14h serait parfait. En Teams?" },
  { id: 5, from: "aimio", name: "Sarah M. — Gestionnaire IA", time: "Aujourd'hui, 10:25", text: "Confirme! Je vous envoie l'invitation Teams. J'ai aussi une question — pour le poste de charge de projet, est-ce que vous seriez ouverts a considerer quelqu'un qui vient du commercial plutot que du residentiel? J'ai un candidat tres fort a 8.9/10 mais son experience est principalement en commercial." },
];

export default function MessagesPage() {
  const [newMessage, setNewMessage] = useState("");

  return (
    <div className="max-w-4xl h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]">Messages</h1>
        <p className="text-gray-400 text-sm mt-1">Communiquez directement avec votre gestionnaire de compte IA</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100/80 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a2332]">Sarah M. — Gestionnaire IA</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[11px] text-gray-400">En ligne</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">Temps de reponse moyen : 12 min</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${msg.from === "client" ? "order-2" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.from === "client"
                    ? "bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white"
                    : "bg-gray-50 text-gray-700"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <div className={`flex items-center gap-1.5 mt-1 ${msg.from === "client" ? "justify-end" : ""}`}>
                  {msg.from === "aimio" ? (
                    <Sparkles size={10} className="text-[#6C2BD9]" />
                  ) : (
                    <User size={10} className="text-gray-400" />
                  )}
                  <span className="text-[10px] text-gray-400">{msg.name} — {msg.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Paperclip size={16} className="text-gray-400" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ecrivez votre message..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#6C2BD9] focus:ring-2 focus:ring-[#6C2BD9]/10 outline-none transition-all text-sm"
            />
            <button className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:from-[#5521B5] hover:to-[#7C3AED] flex items-center justify-center transition-all shadow-sm shadow-[#6C2BD9]/20">
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
