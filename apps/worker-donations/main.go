package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type Customer struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	Cellphone string `json:"cellphone"`
	TaxID     string `json:"taxId"`
}

type PaymentPayload struct {
	ID         string   `json:"id"`
	ExternalID string   `json:"externalId"`
	Status     string   `json:"status"`
	Amount     float64  `json:"amount"`
	Customer   Customer `json:"customer"`
}

func main() {
	// Load environment variables if .env exists
	_ = godotenv.Load()

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "",
		DB:       0,
	})

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal("Erro ao conectar no Redis:", err)
	}

	queueName := "pix:donations:queue"
	fmt.Printf("🚀 Worker Go monitorando fila [%s] no modo %s\n", queueName, os.Getenv("NODE_ENV"))

	for {
		result, err := rdb.BLPop(ctx, 0, queueName).Result()
		if err != nil {
			log.Printf(" Erro ao ler fila: %v. Tentando novamente em 5s...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		payload := result[1]
		go func(p string) {
			err := processPayment(p)
			if err != nil {
				log.Printf(" Falha ao processar Pix: %v", err)
			}
		}(payload)
	}
}

func processPayment(payloadStr string) error {
	var payload PaymentPayload
	if err := json.Unmarshal([]byte(payloadStr), &payload); err != nil {
		// If it's the old payload format (just creation data), we might just log it
		log.Printf(" Payload format mismatch or creation event: %s", payloadStr)
		return nil
	}

	if payload.Status == "" {
		log.Printf("ℹRecebido evento de criação (sem status): %s", payload.ID)
		return nil
	}

	log.Printf(" Processando status [%s] para doação %s (Cliente: %s)", payload.Status, payload.ID, payload.Customer.Name)

	return sendEmail(payload)
}

func sendEmail(p PaymentPayload) error {
	smtpHost := "sandbox.smtp.mailtrap.io"
	smtpPort := "2525"
	username := os.Getenv("USERNAME_MAILER")
	password := os.Getenv("USER_PASSWORD_TRANSPORTER_MAILER")

	if username == "" || password == "" {
		log.Printf("⚠️ SMTP credentials not set (USERNAME_MAILER/USER_PASSWORD_TRANSPORTER_MAILER). Skipping email.")
		return nil
	}

	var subject, body string
	valueBrl := p.Amount / 100.0

	switch p.Status {
	case "PAID":
		subject = "Obrigado pela sua doação!"
		body = fmt.Sprintf("Olá %s,\n\nRecebemos sua doação de R$ %.2f com sucesso. Muito obrigado por apoiar o GameCatalog!\n\nID do Pagamento: %s", p.Customer.Name, valueBrl, p.ID)
	case "EXPIRED":
		subject = "Sua cobrança PIX expirou"
		body = fmt.Sprintf("Olá %s,\n\nA cobrança PIX para sua doação de R$ %.2f expirou. Se ainda desejar contribuir, você pode gerar uma nova doação no nosso site.\n\nID: %s", p.Customer.Name, valueBrl, p.ID)
	case "CANCELLED":
		subject = "Doação cancelada"
		body = fmt.Sprintf("Olá %s,\n\nSua doação de R$ %.2f foi cancelada.\n\nID: %s", p.Customer.Name, valueBrl, p.ID)
	case "REFUNDED":
		subject = "Sua doação foi reembolsada"
		body = fmt.Sprintf("Olá %s,\n\nA sua doação de R$ %.2f foi reembolsada com sucesso.\n\nID: %s", p.Customer.Name, valueBrl, p.ID)
	default:
		log.Printf("❓ Status desconhecido [%s], ignorando envio de email.", p.Status)
		return nil
	}

	auth := smtp.PlainAuth("", username, password, smtpHost)
	to := []string{p.Customer.Email}
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", p.Customer.Email, subject, body))

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, "noreply@gamecatalog.com", to, msg)
	if err != nil {
		return fmt.Errorf("erro ao enviar email: %w", err)
	}

	log.Printf("📧 Email de [%s] enviado com sucesso para %s", p.Status, p.Customer.Email)
	return nil
}
