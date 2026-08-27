import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(
    private supabaseService: SupabaseService, 
    private router: Router
  ) {}

  async handleLogin() {
    try {
      this.loading = true;
      const { error } = await this.supabaseService.signIn(this.email, this.password);
      
      if (error) {
        alert('Erro ao fazer login: ' + error.message);
      } else {
        // Login com sucesso! Redireciona para o painel admin
        this.router.navigate(['/admin']);
      }
    } finally {
      this.loading = false;
    }
  }
}
