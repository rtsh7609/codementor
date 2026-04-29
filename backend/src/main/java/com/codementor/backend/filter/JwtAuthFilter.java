package com.codementor.backend.filter;

import com.codementor.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Look for the Authorization header
        String authHeader = request.getHeader("Authorization");

        // 2. If no header or wrong format, just continue to the next filter
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extract the token (strip the "Bearer " prefix)
        String token = authHeader.substring(7);

        try {
            // 4. Validate the token
            if (jwtService.isTokenValid(token)) {
                String email = jwtService.extractEmail(token);
                Long userId = jwtService.extractUserId(token);

                // 5. Tell Spring Security: this request is authenticated
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,                                          // principal: who the user is
                                null,                                           // credentials: not needed (already verified)
                                List.of(new SimpleGrantedAuthority("ROLE_USER")) // roles
                        );
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Store the userId so controllers can grab it
                request.setAttribute("userId", userId);

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Authenticated request for user: {}", email);
            }
        } catch (Exception e) {
            log.warn("JWT processing failed: {}", e.getMessage());
            // Don't throw — just let Spring Security reject the request later
        }

        // 6. Pass to the next filter
        filterChain.doFilter(request, response);
    }
}