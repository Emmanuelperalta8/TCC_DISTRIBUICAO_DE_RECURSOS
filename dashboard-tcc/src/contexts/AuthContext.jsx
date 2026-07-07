import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      if (session?.user) carregarPerfil(session.user.id);
      else setCarregando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUsuario(session?.user ?? null);
        if (session?.user) carregarPerfil(session.user.id);
        else {
          setPerfil(null);
          setCarregando(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function carregarPerfil(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setPerfil(data ?? null);
    setCarregando(false);
  }

  async function entrar(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) throw error;
  }

  async function cadastrar(email, senha, nomeUsuario) {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_usuario: nomeUsuario } },
    });
    if (error) throw error;
  }

  async function sair() {
    await supabase.auth.signOut();
    setPerfil(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, perfil, carregando, entrar, cadastrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
