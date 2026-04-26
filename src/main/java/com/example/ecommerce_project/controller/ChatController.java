package com.example.ecommerce_project.controller;

import com.example.ecommerce_project.service.ChatService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping(value = "/ask", produces = "text/plain;charset=UTF-8")
    public String ask(@RequestParam String message) {
        return chatService.askAi(message, "ocean@gmail", "ADMIN");
    }
}
