# 0005: LocalStack em versão fixa e segredos no Secrets Manager

**Status:** aceita

## Contexto

O projeto usa SNS, SQS, S3 e Secrets Manager, mas precisa rodar em qualquer computador sem conta AWS. Durante o desenvolvimento, a imagem `localstack/localstack:latest` passou a exigir um token de conta LocalStack para iniciar.

## Decisão

- Usar o LocalStack fixado na tag **4.12**, a edição comunidade que roda sem cadastro. O `docker-compose.yml` explica o motivo.
- Um script de init (`infra/localstack/init-aws.sh`) cria todos os recursos quando o LocalStack fica pronto. O healthcheck do container só passa depois que o script termina, então os serviços só sobem com a infraestrutura pronta.
- O código usa o AWS SDK normalmente; a única diferença entre local e AWS real é a variável `AWS_ENDPOINT`.
- Senha do banco e segredo do JWT ficam no **Secrets Manager**. Os serviços recebem só o nome do segredo e leem o valor na inicialização. Sem `DB_SECRET_ID`/`JWT_SECRET_ID` (testes e desenvolvimento fora do Docker), as configurações vêm de variáveis de ambiente.

## Consequências

- Um comando sobe tudo, sem conta AWS e sem custo.
- Versão fixa evita quebras inesperadas, mas exige atualização manual consciente.
- O LocalStack não aplica políticas IAM; por isso as políticas de privilégio mínimo estão em `infra/iam` como referência para a AWS real.
- Rotação de segredos exigiria reiniciar os serviços (o valor é lido só na inicialização).
