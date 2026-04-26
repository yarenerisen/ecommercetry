import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss']
})
export class PaymentComponent implements OnInit {
  stripe: Stripe | null = null;
  card: StripeCardElement | null = null;
  totalAmount = 100;
  isProcessing = false;

  constructor(private http: HttpClient) {}

 async ngOnInit() {
  this.stripe = await loadStripe('pk_test_51TOz0GELt5iVPm0j1Z58mEGlpLqmugIcEAkNVpaqIXb9nhwjrr2OOPepipE1xrX7mvnHw2u6j9GF9Ea8GUd9txTd00LPIgRrkA');

  if (this.stripe) {
    const elements = this.stripe.elements();
    this.card = elements.create('card');
    this.card.mount('#card-element');
  } else {
    console.error('Stripe failed to load');
  }
}

  async handlePayment(event: Event) {
    event.preventDefault();
    this.isProcessing = true;

    this.http.post<{clientSecret: string}>('/api/payment/create-intent', { amount: this.totalAmount })
      .subscribe({
        next: async (res) => {
          const result = await this.stripe?.confirmCardPayment(res.clientSecret, {
            payment_method: {
              card: this.card!,
            }
          });

          if (result?.error) {
            const errorElement = document.getElementById('card-errors');
            if (errorElement) errorElement.textContent = result.error.message!;
            this.isProcessing = false;
          } else if (result?.paymentIntent.status === 'succeeded') {
            alert('Payment Successful!');
            this.completeOrder();
          }
        },
        error: (err) => {
          console.error('Payment intent error:', err);
          this.isProcessing = false;
        }
      });
  }

  completeOrder() {
    this.http.post('/api/orders', { status: 'Pending', total: this.totalAmount })
      .subscribe({
        next: () => console.log('Order saved as Pending.'),
        error: (err) => console.error('Order save error:', err)
      });
  }
}
