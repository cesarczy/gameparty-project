import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../shared/api/client';
import { useAuth } from '../../../app/auth-context';
import { BrandLogo, Button, Card, ErrorState, Input, Label, PasswordInput, Spinner, BackLink } from '../../../shared/ui';
import { GoogleSignInButton } from '../components/google-sign-in';

const COUNTRIES = [
  { value: '', label: 'Selecione seu país' },
  { value: 'BR', label: 'Brasil' },
  { value: 'PT', label: 'Portugal' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'AR', label: 'Argentina' },
  { value: 'MX', label: 'México' },
  { value: 'ES', label: 'Espanha' },
  { value: 'OTHER', label: 'Outro' },
];

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

type RegisterField =
  | 'username'
  | 'email'
  | 'senha'
  | 'confirmSenha'
  | 'fullName'
  | 'displayName'
  | 'birthDate'
  | 'country'
  | 'language'
  | 'confirmAge18'
  | 'acceptTerms';

type FieldErrors = Partial<Record<RegisterField, string>>;

const REGISTER_FIELD_IDS: Record<RegisterField, string> = {
  username: 'username',
  email: 'email',
  senha: 'senha',
  confirmSenha: 'confirmSenha',
  fullName: 'fullName',
  displayName: 'displayName',
  birthDate: 'birthDate',
  country: 'country',
  language: 'language',
  confirmAge18: 'confirmAge18',
  acceptTerms: 'acceptTerms',
};

function validateUsername(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'Informe um nome de usuário.';
  if (normalized.length < 3) return 'Nome de usuário deve ter pelo menos 3 caracteres.';
  if (normalized.length > 20) return 'Nome de usuário deve ter no máximo 20 caracteres.';
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use apenas letras minúsculas, números ou _ (underscore).';
  }
  return null;
}

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Informe seu e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'E-mail inválido.';
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Informe sua senha.';
  if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  return null;
}

function validateConfirmPassword(senha: string, confirm: string): string | null {
  if (!confirm) return 'Confirme sua senha.';
  if (senha !== confirm) return 'As senhas não coincidem.';
  return null;
}

function validateFullName(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Informe seu nome completo.';
  if (trimmed.length < 2) return 'Nome completo deve ter pelo menos 2 caracteres.';
  if (trimmed.length > 120) return 'Nome completo deve ter no máximo 120 caracteres.';
  return null;
}

function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Informe o nome de exibição.';
  if (trimmed.length < 2) return 'Nome de exibição deve ter pelo menos 2 caracteres.';
  if (trimmed.length > 32) return 'Nome de exibição deve ter no máximo 32 caracteres.';
  return null;
}

function validateBirthDate(value: string): string | null {
  if (!value) return 'Informe sua data de nascimento.';
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 'Data de nascimento inválida.';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 18) return 'É necessário ter 18 anos ou mais para criar uma conta.';
  return null;
}

function validateCountry(value: string): string | null {
  if (!value) return 'Selecione seu país.';
  return null;
}

function validateRegisterForm(values: {
  username: string;
  email: string;
  senha: string;
  confirmSenha: string;
  fullName: string;
  displayName: string;
  birthDate: string;
  country: string;
  confirmAge18: boolean;
  acceptTerms: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  const usernameError = validateUsername(values.username);
  if (usernameError) errors.username = usernameError;
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  const senhaError = validatePassword(values.senha);
  if (senhaError) errors.senha = senhaError;
  const confirmSenhaError = validateConfirmPassword(values.senha, values.confirmSenha);
  if (confirmSenhaError) errors.confirmSenha = confirmSenhaError;
  const fullNameError = validateFullName(values.fullName);
  if (fullNameError) errors.fullName = fullNameError;
  const displayNameError = validateDisplayName(values.displayName);
  if (displayNameError) errors.displayName = displayNameError;
  const birthDateError = validateBirthDate(values.birthDate);
  if (birthDateError) errors.birthDate = birthDateError;
  const countryError = validateCountry(values.country);
  if (countryError) errors.country = countryError;
  if (!values.confirmAge18) errors.confirmAge18 = 'Confirme que tem 18 anos ou mais.';
  if (!values.acceptTerms) {
    errors.acceptTerms = 'Aceite os Termos de Uso e Política de Privacidade.';
  }
  return errors;
}

function mapApiErrorToFields(message: string): FieldErrors {
  const errors: FieldErrors = {};
  const lower = message.toLowerCase();
  if (lower.includes('e-mail') && (lower.includes('cadastrad') || lower.includes('uso'))) {
    errors.email = message;
  } else if (lower.includes('usuário') || lower.includes('username')) {
    errors.username = message;
  } else if (lower.includes('senha')) {
    errors.senha = message;
  } else if (lower.includes('exibição') || lower.includes('display name')) {
    errors.displayName = message;
  } else if (lower.includes('nome completo')) {
    errors.fullName = message;
  } else if (lower.includes('nascimento') || lower.includes('18 anos')) {
    errors.birthDate = message;
  } else if (lower.includes('termos')) {
    errors.acceptTerms = message;
  }
  return errors;
}

function fieldInputClass(
  fieldErrors: FieldErrors,
  flashFields: RegisterField[],
  field: RegisterField,
): string {
  return [
    fieldErrors[field] ? 'field-invalid' : '',
    flashFields.includes(field) ? 'field-flash' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function focusRegisterField(field: RegisterField) {
  const el = document.getElementById(REGISTER_FIELD_IDS[field]);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
    el.focus();
  }
}

function FieldHint({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" role="alert">
      {message}
    </p>
  );
}

const REGISTER_DRAFT_KEY = 'gameparty_register_draft';

type RegisterDraft = {
  username: string;
  fullName: string;
  displayName: string;
  email: string;
  senha: string;
  confirmSenha: string;
  birthDate: string;
  country: string;
  language: string;
  acceptTerms: boolean;
  confirmAge18: boolean;
};

function readRegisterDraft(): RegisterDraft | null {
  try {
    const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RegisterDraft>;
    return {
      username: parsed.username ?? '',
      fullName: parsed.fullName ?? '',
      displayName: parsed.displayName ?? '',
      email: parsed.email ?? '',
      senha: parsed.senha ?? '',
      confirmSenha: parsed.confirmSenha ?? '',
      birthDate: parsed.birthDate ?? '',
      country: parsed.country ?? '',
      language: parsed.language ?? 'pt-BR',
      acceptTerms: parsed.acceptTerms ?? false,
      confirmAge18: parsed.confirmAge18 ?? false,
    };
  } catch {
    return null;
  }
}

function writeRegisterDraft(draft: RegisterDraft) {
  sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
}

function clearRegisterDraft() {
  sessionStorage.removeItem(REGISTER_DRAFT_KEY);
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, senha });
      login({
        token: res.token,
        playerId: res.playerId,
        displayName: res.displayName,
        role: res.role,
        avatarUrl: res.avatarUrl,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <Card className="auth-card">
        <div className="auth-brand">
          <BrandLogo variant="auth" />
        </div>
        <h1 style={{ textAlign: 'center' }}>Entrar</h1>
   
        <p className="muted" style={{ textAlign: 'center' }}>Encontre companhia para jogar online ou campanha.</p>
        <form onSubmit={handleSubmit} className="stack">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <PasswordInput id="senha" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <p className="auth-forgot-row">
            <Link to="/esqueci-senha">Esqueceu a senha?</Link>
          </p>
          {error && <ErrorState message={error} />}
          <Button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
        </form>
        <div className="auth-divider">ou</div>
        <GoogleSignInButton />
        <p className="muted">Novo por aqui? <Link to="/register">Criar conta</Link></p>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const savedDraft = readRegisterDraft();
  const [username, setUsername] = useState(savedDraft?.username ?? '');
  const [fullName, setFullName] = useState(savedDraft?.fullName ?? '');
  const [displayName, setDisplayName] = useState(savedDraft?.displayName ?? '');
  const [email, setEmail] = useState(savedDraft?.email ?? '');
  const [senha, setSenha] = useState(savedDraft?.senha ?? '');
  const [confirmSenha, setConfirmSenha] = useState(savedDraft?.confirmSenha ?? '');
  const [birthDate, setBirthDate] = useState(savedDraft?.birthDate ?? '');
  const [country, setCountry] = useState(savedDraft?.country ?? '');
  const [language, setLanguage] = useState(savedDraft?.language ?? 'pt-BR');
  const [acceptTerms, setAcceptTerms] = useState(savedDraft?.acceptTerms ?? false);
  const [confirmAge18, setConfirmAge18] = useState(savedDraft?.confirmAge18 ?? false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [flashFields, setFlashFields] = useState<RegisterField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    writeRegisterDraft({
      username,
      fullName,
      displayName,
      email,
      senha,
      confirmSenha,
      birthDate,
      country,
      language,
      acceptTerms,
      confirmAge18,
    });
  }, [
    username,
    fullName,
    displayName,
    email,
    senha,
    confirmSenha,
    birthDate,
    country,
    language,
    acceptTerms,
    confirmAge18,
  ]);

  function clearFieldError(field: RegisterField) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function applyFieldErrors(errors: FieldErrors) {
    setFieldErrors(errors);
    const fields = Object.keys(errors) as RegisterField[];
    if (fields.length === 0) return;
    setFlashFields(fields);
    window.setTimeout(() => setFlashFields([]), 1200);
    focusRegisterField(fields[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const errors = validateRegisterForm({
      username,
      email,
      senha,
      confirmSenha,
      fullName,
      displayName,
      birthDate,
      country,
      confirmAge18,
      acceptTerms,
    });

    if (Object.keys(errors).length > 0) {
      applyFieldErrors(errors);
      setError(Object.values(errors)[0] ?? 'Corrija os campos destacados.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        username: username.trim().toLowerCase(),
        email,
        senha,
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        birthDate,
        country,
        language: language as 'pt-BR' | 'en-US' | 'es-ES',
        acceptTerms: true,
        confirmAge18: true,
      });
      login({
        token: res.token,
        playerId: res.playerId,
        displayName: res.displayName,
        role: res.role,
        avatarUrl: res.avatarUrl,
      });
      clearRegisterDraft();
      setInfo(res.verificationMessage ?? 'Conta criada com sucesso.');
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar';
      const apiFieldErrors = mapApiErrorToFields(message);
      if (Object.keys(apiFieldErrors).length > 0) {
        applyFieldErrors(apiFieldErrors);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <Card className="auth-card auth-card-wide">
        <div className="auth-brand">
          <BrandLogo variant="auth" />
        </div>
        <h1>Criar conta</h1>

        <form onSubmit={handleSubmit} className="stack" noValidate>
          <fieldset className="auth-fieldset">
            <legend>Dados obrigatórios</legend>
            <div>
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                required
                minLength={3}
                maxLength={20}
                value={username}
                aria-invalid={fieldErrors.username ? true : undefined}
                className={fieldInputClass(fieldErrors, flashFields, 'username')}
                onChange={(e) => {
                  const next = e.target.value.toLowerCase();
                  setUsername(next);
                  clearFieldError('username');
                }}
                onBlur={() => {
                  const validation = validateUsername(username);
                  if (validation) {
                    setFieldErrors((prev) => ({ ...prev, username: validation }));
                  }
                }}
                placeholder="ex: joao"
              />
              <FieldHint message={fieldErrors.username} />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                aria-invalid={fieldErrors.email ? true : undefined}
                className={fieldInputClass(fieldErrors, flashFields, 'email')}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="ex: joao@gmail.com"
              />
              <FieldHint message={fieldErrors.email} />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <PasswordInput
                id="senha"
                required
                minLength={8}
                value={senha}
                aria-invalid={fieldErrors.senha ? true : undefined}
                className={fieldInputClass(fieldErrors, flashFields, 'senha')}
                onChange={(e) => {
                  setSenha(e.target.value);
                  clearFieldError('senha');
                  if (fieldErrors.confirmSenha) clearFieldError('confirmSenha');
                }}
              />
              <FieldHint message={fieldErrors.senha} />
            </div>
            <div>
              <Label htmlFor="confirmSenha">Confirmar senha</Label>
              <PasswordInput
                id="confirmSenha"
                required
                minLength={8}
                value={confirmSenha}
                aria-invalid={fieldErrors.confirmSenha ? true : undefined}
                className={fieldInputClass(fieldErrors, flashFields, 'confirmSenha')}
                onChange={(e) => {
                  setConfirmSenha(e.target.value);
                  clearFieldError('confirmSenha');
                }}
              />
              <FieldHint message={fieldErrors.confirmSenha} />
            </div>
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                required
                minLength={2}
                maxLength={120}
                value={fullName}
                aria-invalid={fieldErrors.fullName ? true : undefined}
                className={fieldInputClass(fieldErrors, flashFields, 'fullName')}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                placeholder="ex: João da Silva"
              />
              <FieldHint message={fieldErrors.fullName} />
            </div>
            <div>
              <Label htmlFor="displayName">Nome de exibição</Label>
              <Input
                id="displayName"
                required
                minLength={2}
                maxLength={32}
                value={displayName}
                aria-invalid={fieldErrors.displayName ? true : undefined}
                className={fieldInputClass(fieldErrors, flashFields, 'displayName')}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  clearFieldError('displayName');
                }}
                placeholder="Como aparece no chat"
              />
              <FieldHint message={fieldErrors.displayName} />
            </div>
            <div>
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                required
                value={birthDate}
                aria-invalid={fieldErrors.birthDate ? true : undefined}
                className={fieldInputClass(fieldErrors, flashFields, 'birthDate')}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  clearFieldError('birthDate');
                }}
              />
              <FieldHint message={fieldErrors.birthDate} />
            </div>
            <div>
              <Label htmlFor="country">País</Label>
              <select
                id="country"
                className={`input ${fieldInputClass(fieldErrors, flashFields, 'country')}`}
                required
                value={country}
                aria-invalid={fieldErrors.country ? true : undefined}
                onChange={(e) => {
                  setCountry(e.target.value);
                  clearFieldError('country');
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value || 'empty'} value={c.value} disabled={c.value === ''}>{c.label}</option>
                ))}
              </select>
              <FieldHint message={fieldErrors.country} />
            </div>
            <div>
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                className={`input ${fieldInputClass(fieldErrors, flashFields, 'language')}`}
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </fieldset>

          <fieldset className="auth-fieldset">
            <legend>Segurança</legend>
            <label
              className={`checkbox-row ${fieldInputClass(fieldErrors, flashFields, 'confirmAge18')}`}
            >
              <input
                id="confirmAge18"
                type="checkbox"
                checked={confirmAge18}
                onChange={(e) => {
                  setConfirmAge18(e.target.checked);
                  clearFieldError('confirmAge18');
                }}
              />
              <span>Confirmo que tenho 18 anos ou mais</span>
            </label>
            <FieldHint message={fieldErrors.confirmAge18} />
            <label
              className={`checkbox-row ${fieldInputClass(fieldErrors, flashFields, 'acceptTerms')}`}
            >
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  clearFieldError('acceptTerms');
                }}
              />
              <span>
                Aceito os{' '}
                <Link to="/termos">Termos de Uso e Política de Privacidade</Link>
              </span>
            </label>
            <FieldHint message={fieldErrors.acceptTerms} />
            <p className="muted small">
              Após criar a conta, enviaremos um link de verificação para seu e-mail.
            </p>
          </fieldset>

          {error && <ErrorState message={error} />}
          {info && <p className="success-banner">{info}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Criando…' : 'Criar conta'}</Button>
        </form>

        <div className="auth-divider">ou</div>
        <GoogleSignInButton />
        <p className="muted">Já tenho uma conta? <Link to="/login">Entrar</Link></p>
      </Card>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.forgotPassword({ email: email.trim() });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar recuperação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <Card className="auth-card">
        <div className="auth-brand">
          <BrandLogo variant="auth" />
        </div>
        <h1 style={{ textAlign: 'center' }}>Recuperar senha</h1>
        <p className="muted">Informe o e-mail da conta para receber o link de redefinição.</p>
        <form onSubmit={handleSubmit} className="stack">
          <div>
            <Label htmlFor="forgot-email">E-mail</Label>
            <Input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: joao@gmail.com"
            />
          </div>
          {error && <ErrorState message={error} />}
          {message && <p className="success-banner">{message}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar link'}
          </Button>
        </form>
        <BackLink to="/login" className="back-link-center">Voltar ao login</BackLink>
      </Card>
    </div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const senhaError = validatePassword(senha);
    if (senhaError) {
      setError(senhaError);
      return;
    }
    const confirmError = validateConfirmPassword(senha, confirmSenha);
    if (confirmError) {
      setError(confirmError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({ token, senha });
      setMessage(res.message);
      window.setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="page-center">
        <Card className="auth-card">
          <ErrorState message="Link inválido. Solicite uma nova recuperação de senha." />
          <p className="muted"><Link to="/esqueci-senha">Solicitar novo link</Link></p>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-center">
      <Card className="auth-card">
        <div className="auth-brand">
          <BrandLogo variant="auth" />
        </div>
        <h1 style={{ textAlign: 'center' }}>Nova senha</h1>
        <p className="muted">Crie uma nova senha para sua conta.</p>
        <form onSubmit={handleSubmit} className="stack">
          <div>
            <Label htmlFor="reset-senha">Nova senha</Label>
            <PasswordInput
              id="reset-senha"
              required
              minLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reset-confirm">Confirmar nova senha</Label>
            <PasswordInput
              id="reset-confirm"
              required
              minLength={8}
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
            />
          </div>
          {error && <ErrorState message={error} />}
          {message && <p className="success-banner">{message}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Redefinir senha'}
          </Button>
        </form>
        <BackLink to="/login" className="back-link-center">Voltar ao login</BackLink>
      </Card>
    </div>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link de verificação inválido.');
      return;
    }
    api.verifyEmail(token)
      .then((res) => {
        setStatus('ok');
        setMessage(res.alreadyVerified ? 'E-mail já estava verificado.' : 'E-mail verificado com sucesso!');
      })
      .catch((e) => {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Não foi possível verificar o e-mail.');
      });
  }, [token]);

  return (
    <div className="page-center">
      <Card className="auth-card">
        <h1>Verificação de e-mail</h1>
        {status === 'loading' && <Spinner />}
        {status === 'ok' && <p className="success-banner">{message}</p>}
        {status === 'error' && <ErrorState message={message} />}
        <p className="muted"><Link to="/">Ir para o lobby</Link></p>
      </Card>
    </div>
  );
}
