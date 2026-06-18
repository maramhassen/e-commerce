import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/user';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`; // ⚠️ vérifie cette URL dans user.service.ts

  const mockUsers: User[] = [
    { id: 1, nom: 'Doe', prenom: 'John', email: 'john@example.com', motDePasse: '', role: 'ADMIN' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all users', () => {
    service.getAll().subscribe(users => {
      expect(users.length).toBe(1);
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should create a user', () => {
    service.create(mockUsers[0]).subscribe(user => {
      expect(user).toBeTruthy();
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockUsers[0]);
  });

  it('should delete a user', () => {
    service.delete(1).subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});