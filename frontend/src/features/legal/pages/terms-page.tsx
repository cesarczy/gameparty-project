import { AppLayout } from '../../../shared/layout/app-layout';
import { BackLink } from '../../../shared/ui';

export function TermsPage() {
  return (
    <AppLayout>
      <article className="legal-page">
        <header className="content-header">
          <div>
            <p className="eyebrow">Legal</p>
            <h1>Termos de Uso e Política de Privacidade</h1>
            <p className="muted">Última atualização: 21 de julho de 2026</p>
          </div>
        </header>

        <section className="legal-section">
          <h2>1. Aceitação</h2>
          <p>Ao criar uma conta, você declara que leu, compreendeu e concorda com estes
            Termos de Uso e com esta Política de Privacidade.
          </p>
          <p>
            O uso da plataforma é permitido apenas para pessoas com <strong>18 anos ou mais</strong>,
            conforme a legislação aplicável no Brasil.
          </p>
          <p>Caso não concorde com qualquer parte deste documento, não utilize a plataforma.</p>
        </section>

        <section className="legal-section">
          <h2>2. Objetivo da Plataforma</h2>
          <p>
            O GameParty é uma plataforma destinada a conectar jogadores para formar grupos, encontrar
            companheiros de jogo e participar de comunidades relacionadas a diversos jogos online e cooperativos.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Conta do Usuário</h2>
          <p>Ao criar uma conta, você concorda em:</p>
          <ul>
            <li>Ter 18 anos ou mais;</li>
            <li>Fornecer informações verdadeiras e atualizadas;</li>
            <li>Manter sua senha em sigilo;</li>
            <li>Ser responsável por todas as atividades realizadas em sua conta;</li>
            <li>Não compartilhar sua conta com terceiros.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Conduta do Usuário</h2>
          <p>É proibido:</p>
          <ul>
            <li>Publicar conteúdo ofensivo, discriminatório ou ilegal;</li>
            <li>Assediar, ameaçar ou perseguir outros usuários;</li>
            <li>Utilizar bots, scripts ou qualquer ferramenta para prejudicar a plataforma;</li>
            <li>Tentar invadir contas ou explorar falhas de segurança;</li>
            <li>Publicar spam ou propagandas sem autorização.</li>
          </ul>
          <p>
            O descumprimento destas regras poderá resultar em suspensão ou exclusão permanente da conta.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Conteúdo Publicado</h2>
          <p>O usuário permanece proprietário do conteúdo que publicar.</p>
          <p>
            Ao publicar conteúdo no GameParty, você concede à plataforma uma licença para exibi-lo
            enquanto ele permanecer disponível.
          </p>
          <p>Você é o único responsável pelo conteúdo publicado.</p>
        </section>

        <section className="legal-section">
          <h2>6. Privacidade</h2>
          <p>Coletamos apenas as informações necessárias para o funcionamento da plataforma, como:</p>
          <ul>
            <li>Nome de usuário;</li>
            <li>Endereço de e-mail;</li>
            <li>Senha (armazenada de forma criptografada);</li>
            <li>Informações do perfil fornecidas voluntariamente.</li>
          </ul>
          <p>Esses dados são utilizados para:</p>
          <ul>
            <li>Criar e manter sua conta;</li>
            <li>Permitir a recuperação de senha;</li>
            <li>Melhorar a experiência dos usuários;</li>
            <li>Garantir a segurança da plataforma.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Compartilhamento de Dados</h2>
          <p>O GameParty não vende dados pessoais.</p>
          <p>Os dados poderão ser compartilhados apenas quando:</p>
          <ul>
            <li>exigido por lei;</li>
            <li>necessário para investigação de fraudes;</li>
            <li>indispensável para o funcionamento de serviços utilizados pela plataforma.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Cookies</h2>
          <p>Podemos utilizar cookies para:</p>
          <ul>
            <li>manter sua sessão ativa;</li>
            <li>lembrar preferências;</li>
            <li>melhorar o desempenho da plataforma.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Segurança</h2>
          <p>
            Empregamos medidas razoáveis para proteger as informações dos usuários. Entretanto,
            nenhum sistema é completamente imune a falhas ou ataques.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Encerramento da Conta</h2>
          <p>O usuário poderá solicitar a exclusão da conta a qualquer momento.</p>
          <p>
            O GameParty também poderá suspender ou remover contas que violem estes Termos de Uso.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Alterações</h2>
          <p>Estes Termos poderão ser atualizados periodicamente.</p>
          <p>Sempre que houver alterações relevantes, os usuários serão informados.</p>
        </section>

        <section className="legal-section">
          <h2>12. Contato</h2>
          <p>
            Em caso de dúvidas, sugestões ou solicitações relacionadas à privacidade ou aos Termos de Uso,
            utilize os canais de contato disponibilizados pela plataforma.
          </p>
        </section>

        <BackLink to="/register" className="back-link-center">Voltar ao cadastro</BackLink>
      </article>
    </AppLayout>
  );
}
