import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function PaginaCadastro({ onIrLogin }) {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmaSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      await cadastrar(email, senha, nome);
      setSucesso(true);
    } catch (err) {
      setErro(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="auth-bg">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-success-icon">✓</div>
          <h1 className="auth-title">Cadastro realizado!</h1>
          <p className="auth-desc" style={{ margin: "12px auto 24px" }}>
            Verifique seu e-mail para confirmar a conta e depois faça login.
          </p>
          <button className="auth-btn" onClick={onIrLogin}>
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">

        <div className="auth-brand">
          <img src="/logo.png" alt="DRF Logo" className="auth-logo" />
        </div>

        <h1 className="auth-title">Criar Conta</h1>
        <p className="auth-desc">Preencha os dados para solicitar acesso ao relatório.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Nome de usuário</label>
            <input
              type="text"
              className="auth-input"
              placeholder="Seu nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">E-mail</label>
            <input
              type="email"
              className="auth-input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Senha</label>
            <input
              type="password"
              className="auth-input"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirmar senha</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={confirmaSenha}
              onChange={e => setConfirmaSenha(e.target.value)}
              required
            />
          </div>

          {erro && <div className="auth-error">{erro}</div>}

          <button type="submit" className="auth-btn" disabled={carregando}>
            {carregando ? "Criando conta…" : "Criar Conta"}
          </button>
        </form>

        <div className="auth-footer">
          Já tem conta?{" "}
          <button className="auth-link" onClick={onIrLogin}>
            Fazer login
          </button>
        </div>

      </div>
    </div>
  );
}
