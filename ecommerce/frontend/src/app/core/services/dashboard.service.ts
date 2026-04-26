import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAdminStats(): Observable<any> {
    return forkJoin({
      users:    this.http.get<any[]>(`${this.API}/users`),
      orders:   this.http.get<any[]>(`${this.API}/orders`),
      products: this.http.get<any[]>(`${this.API}/products`),
    }).pipe(
      map(({ users, orders, products }) => ({
        totalUsers:    users.length,
        totalOrders:   orders.length,
        totalRevenue:  orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        totalProducts: products.length,
      }))
    );
  }

  getSellerStats(storeId: number = 1): Observable<any> {
    return forkJoin({
      products: this.http.get<any[]>(`${this.API}/products/store/${storeId}`),
      orders:   this.http.get<any[]>(`${this.API}/orders/store/${storeId}`),
    }).pipe(
      map(({ products, orders }) => ({
        myProducts: products.length,
        myOrders:   orders.length,
        myRevenue:  orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0),
        myReviews:  0
      }))
    );
  }

  getCustomerStats(userId: number = 1): Observable<any> {
    return forkJoin({
      orders:  this.http.get<any[]>(`${this.API}/orders/user/${userId}`),
    }).pipe(
      map(({ orders }) => ({
        myOrders:      orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'PENDING').length,
        myReviews:     0
      }))
    );
  }
}
