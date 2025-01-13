"use server";
import { RegisterSchema, signInSchema } from "@/lib/zod";
import { hashSync } from "bcrypt-ts";
import { prisma } from "@/lib/prisma";
import {redirect} from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export const signUpCredentials = async(
    prevState:unknown,
    formData: FormData) => {

    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success){
        return{
    error: validatedFields.error.flatten().fieldErrors
}

}
const {name, email, password} = validatedFields.data
const hashedPassword = hashSync(password,10);

try {
    await prisma.user.create({
        data:{
             name,
            email,
            password: hashedPassword
        }
    
    })
} catch (error) {
    return{message: "Failed to register user"}

}
redirect ("/login");
};

// sign in credential action
export const signInCredentials = async(prevState: unknown, formData:FormData) => {
    const validatedFields = signInSchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success){
        return{
    error: validatedFields.error.flatten().fieldErrors
};

}
const {email, password} = validatedFields.data;

try {
    await signIn("credentials", {email, password, redirectTo: "/dashboard"})
}catch (error) {
    if(error instanceof AuthError){
        switch (error.type) {
            case "CredentialsSignin":
                return {message: "Invalid Credentials."}
                default:
                    return {message: "something went wrong."}
        }
    }
    throw error

}


}
