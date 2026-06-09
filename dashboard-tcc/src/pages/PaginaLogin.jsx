import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function PaginaLogin({ onIrCadastro }) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await entrar(email, senha);
    } catch {
      setErro("E-mail ou senha incorretos. Verifique e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">

        <div className="auth-brand">
          <img src="/logo.png" alt="DRF Logo" className="auth-logo" />
        </div>

        <h1 className="auth-title">Acessar o Painel</h1>
        <p className="auth-desc">
          Digite suas credenciais para visualizar o relatório de distribuição de recursos.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">E-mail</label>
            <input
              type="email"
              className="auth-input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Senha</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && <div className="auth-error">{erro}</div>}

          <button type="submit" className="auth-btn" disabled={carregando}>
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="auth-footer">
          Não tem acesso?{" "}
          <button className="auth-link" onClick={onIrCadastro}>
            Criar conta
          </button>
        </div>

      </div>
    </div>
  );
}
