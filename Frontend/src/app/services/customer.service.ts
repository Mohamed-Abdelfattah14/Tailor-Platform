import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CustomerSignup, UserLogin } from '../components/shared/models';
import { BindingService } from './binding/binding.service';
import { User } from './user.model';

interface Login {
  token: String;
  id: String;
  isTailor: Boolean;
}
@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(private http: HttpClient, private router: Router, private binding: BindingService) {}
  // BehaviourSubject will return the initial value or the current value on Subscription
  // Subject does not return the current value on Subscription. It triggers only on .next(value) call and return/output the value
  user = new BehaviorSubject<User | null>(null);
  private BaseUrl = 'http://localhost:3000/users';
  private URL = 'https://tailor-s.herokuapp.com/api/users';
  private test = 'http://localhost:3000/api/users';

  signUp(user: CustomerSignup) {
    return this.http
      .post(`${this.URL}/signup`, user, {
        observe: 'response',
      })
      .pipe(catchError(this.handleError));
  }

  login(user: UserLogin) {
    this.binding.changeLoading(true);
    return this.http
      .post<Login>(`${this.URL}/login`, user, {
        observe: 'response',
      })
      .pipe(
        catchError(this.handleError),
        tap((res) => {
          this.binding.changeLoading(false)
          const user = new User(
            res.body!.id,
            res.body!.isTailor,
            res.body!.token
          );
          this.user.next(user);
          localStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  autoLogin() {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    // if user not found in local storage return
    if (userData === null) return;
    // if exist emiting him into app memory
    const loadedUser = new User(userData.id, userData.isTailor, userData.token);
    if (loadedUser.Token) this.user.next(loadedUser);
  }

  logout() {
    this.user.next(null);
    localStorage.removeItem('user');
    this.router.navigate(['login']);
  }

  // remember to add autoLogout before token expire or request new token

  get_all_customers() {
    this.binding.changeLoading(true);
    return this.http.get(this.URL).pipe(
      tap(
        res => this.binding.changeLoading(false)
      )
    )
  }

  getCustomerInfoByID(id: number) {
    return this.http.get(`${this.BaseUrl}/${id}`);
  }

  updateCustomerInfo(id: number, customer: any) {
    return this.http.put(`${this.BaseUrl}/${id}`, customer);
  }

  get_customer_info_id(id: any) {
    this.binding.changeLoading(true);
    return this.http
      .get(`${this.URL}/${id}`, {
        observe: 'response',
      })
      .pipe(catchError(this.handleError),      tap(
        res => this.binding.changeLoading(false)
      ));
  }

  update_customer_info(id: string, body: any) {
    return this.http.put(`${this.URL}/${id}`, body, {
      observe: 'response',
    });
  }

  deleteCustomer(id: any) {
    return this.http.delete(`${this.BaseUrl}/${id}`, {
      observe: 'response',
    });
  }

  private handleError(err: HttpErrorResponse) {
    console.log(err);
    if (err.error.message == 'NOT FOUND')
      return throwError('Email or Password wrong.');
    if (!err.error.message) return throwError('Somthing went wrong.');
    return throwError(err.error.message);
  }
}
