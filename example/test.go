package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"

	pb "github.com/stabai/linterface/example/gen/proto/go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

func main() {
	port, err := strconv.Atoi(os.Getenv("GRPC_PORT"))
	if err != nil {
		port = 50051
	}
	flag.Parse()

	log.Println("Initializing server...")
	initializeServer(port)
}

func initializeServer(port int) {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	reflection.Register(s)
	grpc_health_v1.RegisterHealthServer(s, health.NewServer())
	pb.RegisterPetStoreServer(s, pb.NewPetStore())

	log.Printf("server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
