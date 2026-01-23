package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

func main() {
	
	rdb := redis.NewClient(&redis.Options{
		Addr:	     "127.0.0.1:6379",
		Password: "",               
		DB:       0,                // DB padrão
	})

	
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal("Erro ao conectar no Redis:", err)
	}

	queueName := "pix:donations:queue"
	fmt.Printf(" Worker Go monitorando fila [%s] no modo %s\n", queueName, os.Getenv("NODE_ENV"))

	for {
		
		result, err := rdb.BLPop(ctx, 0, queueName).Result()
		
		if err != nil {
			log.Printf("Erro ao ler fila: %v. Tentando novamente em 5s...", err)
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

func processPayment(payload string) error {
	fmt.Printf("Processando novo Pix: %s\n", payload)
	time.Sleep(2 * time.Second) 
	
	
	return nil
}