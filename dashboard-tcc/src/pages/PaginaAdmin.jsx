import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../contexts/AuthContext";

const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FORM_VAZIO = { nome_usuario: "", email: "", senha: "", role: "usuario" };

export default function PaginaAdmin() {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (perfil?.role === "admin") carregarUsuarios();
  }, [perfil]);

  async function carregarUsuarios() {
    setCarregando(true);
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsuarios(data ?? []);
    setCarregando(false);
  }

  function abrirNovo() {
    setModoEdicao(null);
    setForm(FORM_VAZIO);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(u) {
    setModoEdicao(u);
    setForm({ nome_usuario: u.nome_usuario, email: u.email, senha: "", role: u.role });
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setErro("");
  }

  function setField(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function salvar() {
    if (!form.nome_usuario.trim()) { setErro("Informe o nome de usuário."); return; }
    setErro("");
    setSalvando(true);
    try {
      if (modoEdicao) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            nome_usuario: form.nome_usuario.trim(),
            role: form.role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", modoEdicao.id);
        if (error) throw error;

        if (form.senha) {
          const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(
            modoEdicao.id,
            { password: form.senha }
          );
          if (pwErr) throw pwErr;
        }
      } else {
        if (!form.email.trim()) { setErro("Informe o e-mail."); setSalvando(false); return; }
        if (form.senha.length < 6) { setErro("A senha deve ter no mínimo 6 caracteres."); setSalvando(false); return; }

        const { error } = await supabaseAdmin.auth.admin.createUser({
          email: form.email.trim(),
          password: form.senha,
          user_metadata: { nome_usuario: form.nome_usuario.trim(), role: form.role },
          email_confirm: true,
        });
        if (error) throw error;
      }

      await carregarUsuarios();
      fecharModal();
    } catch (err) {
      setErro(err.message || "Erro ao salvar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(u) {
    if (!window.confirm(`Excluir o usuário "${u.nome_usuario}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
    if (!error) await carregarUsuarios();
  }

  if (perfil?.role !== "admin") {
    return (
      <main className="page-content">
        <div className="empty-state">Acesso restrito a administradores.</div>
      </main>
    );
  }

  return (
    <main className="page-content">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Administração</div>
          <h1 className="page-title">Gerenciar Usuários</h1>
          <p className="page-desc">Cadastre, edite e remova os usuários do sistema.</p>
        </div>
        <button className="auth-btn admin-novo-btn" onClick={abrirNovo}>
          + Novo Usuário
        </button>
      </div>

      {carregando ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <table className="ranking admin-table">
            <thead>
              <tr>
                <th>Nome de Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Cadastrado em</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: "var(--text)" }}>{u.nome_usuario}</td>
                  <td style={{ color: "var(--text-2)" }}>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-3)" }}>
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="table-btn" onClick={() => abrirEdicao(u)}>Editar</button>
                    <button className="table-btn table-btn-danger" onClick={() => excluir(u)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <div className="empty-state">Nenhum usuário encontrado.</div>
          )}
        </div>
      )}

      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {modoEdicao ? "Editar Usuário" : "Novo Usuário"}
            </h2>

            <div className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Nome de usuário</label>
                <input
                  className="auth-input"
                  placeholder="Nome completo"
                  value={form.nome_usuario}
                  onChange={e => setField("nome_usuario", e.target.value)}
                  autoFocus
                />
              </div>

              {!modoEdicao && (
                <div className="auth-field">
                  <label className="auth-label">E-mail</label>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={e => setField("email", e.target.value)}
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">
                  {modoEdicao ? "Nova senha (deixe em branco para não alterar)" : "Senha"}
                </label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={e => setField("senha", e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Perfil de acesso</label>
                <select
                  className="auth-input"
                  value={form.role}
                  onChange={e => setField("role", e.target.value)}
                >
                  <option value="usuario">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {erro && <div className="auth-error">{erro}</div>}

              <div className="modal-actions">
                <button className="auth-btn" onClick={salvar} disabled={salvando}>
                  {salvando ? "Salvando…" : "Salvar"}
                </button>
                <button className="auth-btn auth-btn-outline" onClick={fecharModal}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
