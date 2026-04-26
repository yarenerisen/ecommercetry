import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatResponse {
  reply: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnDestroy {
  private readonly AI_API = 'http://localhost:8081/api/chat/ask';

  isOpen = false;
  inputText = '';
  isTyping = false;
  apiOnline = true;

  messages: Message[] = [
    {
      role: 'assistant',
      text: 'Selam Yaren! 👋 Mağaza verilerini analiz etmeye hazırım. Ne sormak istersin?',
      timestamp: new Date()
    }
  ];

  quickReplies = [
    'En çok harcama yapan 3 kişiyi getir',
    'Hangi şehirden ne kadar sipariş verilmiş?',
    'En düşük puan alan ürünler hangileri?',
    'Depoların gönderim sayılarını listele'
  ];

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendQuickReply(text: string) {
    this.inputText = text;
    this.send();
  }
  send() {
    const trimmed = this.inputText.trim();
    if (!trimmed || this.isTyping) return;

    this.messages.push({ role: 'user', text: trimmed, timestamp: new Date() });
    this.inputText = '';
    this.isTyping = true;
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 50);

    this.http.get(this.AI_API + '?message=' + encodeURIComponent(trimmed), { responseType: 'text' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: string) => {
          this.apiOnline = true;
          this.messages.push({ role: 'assistant', text: res, timestamp: new Date() });
          this.isTyping = false;
          this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 50);
        },
        error: (err) => {
          console.error("Bağlantı hatası:", err);
          this.apiOnline = false;
          this.messages.push({
            role: 'assistant',
            text: '⚠️ Java Backend kapalı veya CORS hatası var! (8081 portunu kontrol et)',
            timestamp: new Date()
          });
          this.isTyping = false;
          this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 50);
        }
      });
}

  private scrollToBottom() {
    const el = document.querySelector('.chat__messages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
  formatMessage(text: string): string {
  if (!text) return '';

  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/---/g, '<hr style="border:0; border-top:1px solid #eee; margin:10px 0;">')
    .replace(/\n/g, '<br>');

  return formatted;
}
}
