package com.weekloop.service;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.User;
import com.weekloop.repository.UserRepository;
import com.weekloop.util.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder, JwtUtils jwtUtils, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email đã được sử dụng!");
        }

        String encodedPassword = passwordEncoder.encode(req.password());
        User user = new User(req.fullName(), req.email(), encodedPassword);
        userRepository.save(user);

        String token = jwtUtils.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        var authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(req.email(), req.password())
        );
        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        String token = jwtUtils.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail());
    }

    public UserProfileResponse getProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getFullName(), user.getEmail());
    }
}
