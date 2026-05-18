package com.nsobrero.blogArtesanos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BlogArtesanosApplication {

	public static void main(String[] args) {
		SpringApplication.run(BlogArtesanosApplication.class, args);
	}

}
