package com.nsobrero.blogArtesanos.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/*
 * Tests del rate limiter. Verifica que después de N intentos, las siguientes
 * requests reciben 429.
 */
class RateLimitFilterTest {

    @Test
    void permitePrimerosIntentosDeLogin() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = postReq("/api/auth/login", "1.2.3.4");
            MockHttpServletResponse res = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);
            filter.doFilter(req, res, chain);
            verify(chain, times(1)).doFilter(any(), any());
            assertNotEquals(429, res.getStatus(), "Intento " + (i + 1) + " no debería ser 429");
        }
    }

    @Test
    void sextoIntentoLoginDevuelve429() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        String ip = "5.6.7.8";
        // Consumir los 5 permitidos
        for (int i = 0; i < 5; i++) {
            filter.doFilter(postReq("/api/auth/login", ip), new MockHttpServletResponse(), mock(FilterChain.class));
        }
        // Sexto intento
        MockHttpServletRequest req = postReq("/api/auth/login", ip);
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(req, res, chain);

        assertEquals(429, res.getStatus());
        assertNotNull(res.getHeader("Retry-After"));
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void ipsDiferentesNoSeAfectan() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        // IP A: gasta sus 5 intentos
        for (int i = 0; i < 5; i++) {
            filter.doFilter(postReq("/api/auth/login", "1.1.1.1"), new MockHttpServletResponse(), mock(FilterChain.class));
        }
        // IP B: debería poder hacer su primer intento sin problema
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(postReq("/api/auth/login", "9.9.9.9"), res, chain);
        assertNotEquals(429, res.getStatus());
        verify(chain).doFilter(any(), any());
    }

    @Test
    void getNoEstaRateLimited() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/auth/login");
        req.setRemoteAddr("1.2.3.4");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(req, res, chain);
        verify(chain).doFilter(any(), any());
    }

    private MockHttpServletRequest postReq(String uri, String ip) {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", uri);
        req.setRemoteAddr(ip);
        return req;
    }
}
